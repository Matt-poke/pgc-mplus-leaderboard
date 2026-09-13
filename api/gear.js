import { getItemPreview } from "../lib/blizzard.js";

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

    const gearSlots = await Promise.all(
      Object.entries(data.gear?.items || {}).map(async ([slot, item]) => {
        const preview = await getItemPreview(item.item_id, item.bonuses);
        return {
          slot,
          name: item.name,
          icon: item.icon,
          itemLevel: item.item_level,
          quality: item.item_quality,
          enchant: item.enchants_detail?.[0]?.name || null,
          gems: (item.gems_detail || []).map((g) => g.name),
          stats: preview.stats,
          setBonus: preview.setBonus,
        };
      })
    );

    // Les talents choisis : on ne garde que ceux qui ont un sort associé
    // (certains nœuds du loadout sont des connecteurs sans effet propre).
    // subTreeId différent de 0 indique un talent de héros.
    const seen = new Set();
    const talents = [];
    for (const entry of data.talentLoadout?.loadout || []) {
      const chosen = entry.node?.entries?.[entry.entryIndex];
      const spell = chosen?.spell;
      if (!spell?.name || seen.has(spell.name)) continue;
      seen.add(spell.name);
      talents.push({
        nodeId: entry.node?.id,
        spellId: spell.id,
        name: spell.name,
        icon: spell.icon,
        rank: entry.rank,
        maxRanks: chosen.maxRanks,
        isHero: (entry.node?.subTreeId || 0) !== 0,
        row: entry.node?.row ?? 0,
        col: entry.node?.col ?? 0,
      });
    }

    res.status(200).json({
      name: data.name,
      className: data.class,
      specName: data.active_spec_name,
      race: data.race,
      thumbnailUrl: data.thumbnail_url,
      itemLevelEquipped: data.gear?.item_level_equipped,
      gearSlots,
      talents,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
