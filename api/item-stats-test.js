import { getBattleNetToken } from "./_blizzard.js";

export default async function handler(req, res) {
  try {
    const token = await getBattleNetToken();
    // Objet de test : "Crown of the Primal Leywarden" (271564), avec les
    // bonusIDs qu'on avait vus dans les données WCL/Raider.IO plus tôt.
    const bonusIds = ["6652", "13846", "13333", "13696", "12838", "13692", "13698", "1561"];
    const url = `https://us.api.blizzard.com/data/wow/item/271564?namespace=static-us&locale=fr_FR&bonus_id=${bonusIds.join(":")}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await r.json();
    res.status(200).json({ status: r.status, stats: data.preview_item?.stats, fullPreview: data.preview_item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
