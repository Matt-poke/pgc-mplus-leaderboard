import { graphql } from "./_wcl.js";

// Test avec un report qu'on a déjà validé au tout début (le n°1 mondial
// Mage Givre sur Altar of Fangs) — peu importe de qui il s'agit, on valide
// juste le mécanisme.
const TEST_CODE = "vLNz1M3dj2mrHDKX";
const TEST_FIGHT_ID = 9;
const TEST_NAME = "看看侃栞栞刊";

export default async function handler(req, res) {
  try {
    // Étape 1 : retrouver l'ID interne (sourceID) du joueur dans CE combat précis.
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
      { code: TEST_CODE, fightID: TEST_FIGHT_ID }
    );

    const damageTable = await graphql(
      `
        query($code: String!, $fightID: Int!, $sourceID: Int!) {
          reportData {
            report(code: $code) {
              table(fightIDs: [$fightID], dataType: DamageDone, sourceID: $sourceID)
            }
          }
        }
      `,
      { code: TEST_CODE, fightID: TEST_FIGHT_ID, sourceID: 368 }
    );

    res.status(200).json({ playerData, damageTable });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
