import { graphql, getClassNameById } from "../lib/wcl.js";

export default async function handler(req, res) {
  const { name, server, region } = req.query;

  if (!name || !server || !region) {
    res.status(400).json({ error: "Paramètres requis : name, server, region" });
    return;
  }

  try {
    const zoneId = Number(process.env.WCL_ZONE_ID || 55);

    const data = await graphql(
      `
        query($name: String!, $server: String!, $region: String!, $zoneId: Int!) {
          characterData {
            character(name: $name, serverSlug: $server, serverRegion: $region) {
              id
              name
              classID
              zoneRankings(zoneID: $zoneId)
            }
          }
        }
      `,
      { name, server, region, zoneId }
    );

    const character = data?.characterData?.character;
    if (!character) {
      res.status(404).json({ error: "Personnage introuvable" });
      return;
    }

    const className = await getClassNameById(character.classID);
    const rankings = character.zoneRankings?.rankings || [];

    const dungeons = rankings.map((r) => ({
      dungeon: r.encounter?.name,
      spec: r.spec,
      score: r.bestAmount,
      itemLevel: r.bestRank?.ilvl,
      rankPercent: r.rankPercent,
    }));

    const total = dungeons.reduce((sum, d) => sum + (d.score || 0), 0);

    // La spé la plus jouée par ce joueur cette saison, pour choisir contre
    // qui le comparer par défaut.
    const mainSpec = character.zoneRankings?.allStars?.[0]?.spec || dungeons[0]?.spec || null;

    res.status(200).json({
      id: character.id,
      name: character.name,
      className,
      mainSpec,
      total,
      dungeons,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
