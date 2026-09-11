// Récupère le stuff et les talents ACTUELS d'un personnage via Raider.IO —
// contrairement aux données de classement Warcraft Logs, ça marche pour
// n'importe quel joueur, pas seulement ceux du top mondial.
export default async function handler(req, res) {
  const { name, server, region } = req.query;

  if (!name || !server || !region) {
    res.status(400).json({ error: "Paramètres requis : name, server, region" });
    return;
  }

  try {
    const url = `https://raider.io/api/v1/characters/profile?region=${region.toLowerCase()}&realm=${encodeURIComponent(server)}&name=${encodeURIComponent(name)}&fields=gear,talents`;
    const r = await fetch(url);

    if (!r.ok) {
      res.status(r.status).json({ error: `Raider.IO a répondu ${r.status} (personnage introuvable ?)` });
      return;
    }

    const data = await r.json();

    const gearSlots = Object.entries(data.gear?.items || {}).map(([slot, item]) => ({
      slot,
      name: item.name,
      itemLevel: item.item_level,
      quality: item.item_quality,
    }));

    // Les talents choisis : on ne garde que ceux qui ont un sort associé
    // (certains nœuds du loadout sont des connecteurs sans effet propre),
    // et on déduplique par nom.
    const talentNames = [
      ...new Set(
        (data.talentLoadout?.loadout || [])
          .map((entry) => entry.node?.entries?.[entry.entryIndex]?.spell?.name)
          .filter(Boolean)
      ),
    ];

    res.status(200).json({
      name: data.name,
      className: data.class,
      specName: data.active_spec_name,
      race: data.race,
      thumbnailUrl: data.thumbnail_url,
      itemLevelEquipped: data.gear?.item_level_equipped,
      gearSlots,
      talentNames,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
