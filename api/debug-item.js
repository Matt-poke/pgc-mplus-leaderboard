import { getItemPreview } from "../lib/blizzard.js";

export default async function handler(req, res) {
  try {
    const name = "Méthiø";
    const url = `https://raider.io/api/v1/characters/profile?region=eu&realm=hyjal&name=${encodeURIComponent(name)}&fields=gear`;
    const r = await fetch(url);
    const data = await r.json();

    const waist = data.gear?.items?.waist;
    const preview = await getItemPreview(waist?.item_id, waist?.bonuses);

    res.status(200).json({ raiderIoItem: waist, blizzardPreview: preview });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
