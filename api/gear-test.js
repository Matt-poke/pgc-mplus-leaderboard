export default async function handler(req, res) {
  const { name, server, region } = req.query;
  try {
    const url = `https://raider.io/api/v1/characters/profile?region=${region.toLowerCase()}&realm=${server}&name=${name}&fields=gear,talents,mythic_plus_scores_by_season`;
    const r = await fetch(url);
    const text = await r.text();
    res.status(200).json({ status: r.status, body: text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
