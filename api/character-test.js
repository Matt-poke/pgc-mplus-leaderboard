import { graphql } from "./_wcl.js";

// Endpoint de test — renvoie la réponse BRUTE de Warcraft Logs pour un
// personnage donné, sans transformation. Une fois qu'on a confirmé la
// structure exacte des données, on la nettoiera pour ne renvoyer que ce
// dont le front a besoin.
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

    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
