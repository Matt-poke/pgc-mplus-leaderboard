import { graphql } from "./_wcl.js";

export default async function handler(req, res) {
  try {
    const data = await graphql(`
      query {
        characterData {
          character(id: 81503069) {
            recentReports {
              data {
                code
                startTime
                zone { name }
              }
            }
          }
        }
      }
    `);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
