import { graphql } from "../lib/wcl.js";

export default async function handler(req, res) {
  const { code, fightID, name } = req.query;

  if (!code || !fightID || !name) {
    res.status(400).json({ error: "Paramètres requis : code, fightID, name" });
    return;
  }

  try {
    // Étape 1 : retrouver l'ID interne (sourceID) du joueur dans ce combat.
    const playerData = await graphql(
      `
        query($code: String!, $fightID: Int!) {
          reportData {
            report(code: $code) {
              playerDetails(fightIDs: [$fightID])
            }
          }
        }
      `,
      { code, fightID: Number(fightID) }
    );

    const details = playerData?.reportData?.report?.playerDetails?.data?.playerDetails;
    const allPlayers = [
      ...(details?.dps || []),
      ...(details?.healers || []),
      ...(details?.tanks || []),
    ];
    const player = allPlayers.find((p) => p.name === name);

    if (!player) {
      res.status(404).json({ error: `Joueur "${name}" introuvable dans ce combat` });
      return;
    }

    // Étape 2 : la table de dégâts, filtrée sur ce joueur uniquement.
    const tableData = await graphql(
      `
        query($code: String!, $fightID: Int!, $sourceID: Int!) {
          reportData {
            report(code: $code) {
              table(fightIDs: [$fightID], dataType: DamageDone, sourceID: $sourceID)
            }
          }
        }
      `,
      { code, fightID: Number(fightID), sourceID: player.id }
    );

    const table = tableData?.reportData?.report?.table?.data;
    const entries = table?.entries || [];
    const totalDamage = entries.reduce((sum, e) => sum + (e.total || 0), 0);
    const totalTimeMs = table?.totalTime || 0;

    const abilities = entries
      .map((e) => ({
        name: e.name,
        total: e.total,
        percent: totalDamage > 0 ? (e.total / totalDamage) * 100 : 0,
        casts: e.uses ?? e.hitCount ?? 0,
        dps: totalTimeMs > 0 ? e.total / (totalTimeMs / 1000) : 0,
      }))
      .filter((a) => a.total > 0)
      .sort((a, b) => b.total - a.total);

    res.status(200).json({
      characterName: player.name,
      spec: player.specs?.[0]?.spec,
      totalDamage,
      totalTimeMs,
      abilities,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
