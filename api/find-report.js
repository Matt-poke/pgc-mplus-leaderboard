import { graphql } from "./_wcl.js";

export default async function handler(req, res) {
  const { characterId, dungeon } = req.query;

  if (!characterId || !dungeon) {
    res.status(400).json({ error: "Paramètres requis : characterId, dungeon" });
    return;
  }

  try {
    const recentData = await graphql(
      `
        query($characterId: Int!) {
          characterData {
            character(id: $characterId) {
              recentReports {
                data {
                  code
                  zone { name }
                }
              }
            }
          }
        }
      `,
      { characterId: Number(characterId) }
    );

    const reports = recentData?.characterData?.character?.recentReports?.data || [];
    // On ne garde que les reports de la saison M+ en cours, pas les logs de
    // raid, monde ouvert, etc.
    const candidates = [...new Set(reports.filter((r) => r.zone?.name === "Mythic+ Season 2").map((r) => r.code))];

    let best = null;

    for (const code of candidates) {
      const fightsData = await graphql(
        `
          query($code: String!) {
            reportData {
              report(code: $code) {
                fights {
                  id
                  name
                  keystoneLevel
                }
              }
            }
          }
        `,
        { code }
      );

      const fights = fightsData?.reportData?.report?.fights || [];
      for (const f of fights) {
        if (f.name === dungeon && f.keystoneLevel) {
          if (!best || f.keystoneLevel > best.keystoneLevel) {
            best = { code, fightID: f.id, keystoneLevel: f.keystoneLevel };
          }
        }
      }
    }

    if (!best) {
      res.status(404).json({ error: "Aucun report récent trouvé pour ce donjon" });
      return;
    }

    res.status(200).json(best);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
