import { graphql } from "./_wcl.js";

export default async function handler(req, res) {
  const { server, region } = req.query;
  try {
    const data = await graphql(
      `
        query($server: String!, $region: String!) {
          worldData {
            encounter(id: 12993) {
              characterRankings(
                className: "Mage"
                specName: "Arcane"
                metric: playerscore
                serverSlug: $server
                serverRegion: $region
                includeCombatantInfo: true
              )
            }
          }
        }
      `,
      { server, region }
    );
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
