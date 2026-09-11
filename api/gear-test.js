import { graphql } from "./_wcl.js";

export default async function handler(req, res) {
  const { name, server, region } = req.query;
  try {
    const data = await graphql(
      `
        query($name: String!, $server: String!, $region: String!) {
          characterData {
            character(name: $name, serverSlug: $server, serverRegion: $region) {
              id
              name
              gearItems: gear
            }
          }
        }
      `,
      { name, server, region }
    );
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
