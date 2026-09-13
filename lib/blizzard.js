let cachedToken = null;
let cachedTokenExpiry = 0;

export async function getBattleNetToken() {
  if (cachedToken && Date.now() < cachedTokenExpiry) {
    return cachedToken;
  }

  const basicAuth = Buffer.from(
    `${process.env.BATTLENET_CLIENT_ID}:${process.env.BATTLENET_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch("https://oauth.battle.net/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`Échec auth Battle.net : ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  cachedTokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

async function bnetGet(path) {
  const token = await getBattleNetToken();
  const res = await fetch(`https://us.api.blizzard.com${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Échec requête Battle.net (${path}) : ${res.status}`);
  }
  return res.json();
}

// Récupère l'arbre complet (classe + spé + arbres de héros compatibles)
// pour une spécialisation donnée.
export async function getFullTalentTree(treeId, specId) {
  const specTree = await bnetGet(
    `/data/wow/talent-tree/${treeId}/playable-specialization/${specId}?namespace=static-us&locale=fr_FR`
  );

  const heroTrees = (specTree.hero_talent_trees || []).filter((tree) =>
    (tree.playable_specializations || []).some((s) => s.id === specId)
  );

  // Les nœuds d'arbre de héros apparaissent aussi, en double, dans la liste
  // brute des talents de spécialisation — on les retire de cette liste.
  const heroNodeIds = new Set(heroTrees.flatMap((t) => (t.hero_talent_nodes || []).map((n) => n.id)));
  const specNodesOnly = (specTree.spec_talent_nodes || []).filter((n) => !heroNodeIds.has(n.id));

  return {
    classNodes: specTree.class_talent_nodes || [],
    specNodes: specNodesOnly,
    heroTrees: heroTrees.map((t) => ({
      id: t.id,
      name: t.name,
      nodes: t.hero_talent_nodes || [],
    })),
  };
}

// Récupère l'icône (URL) de chaque sort demandé, en parallèle. Renvoie une
// Map spellId -> url. Les échecs individuels sont ignorés (icône manquante
// plutôt que de faire échouer tout l'arbre).
function rgbToHex({ r, g, b } = {}) {
  if (r === undefined) return "#ffffff";
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

// Stats calculées d'un objet précis, en tenant compte de ses bonus IDs
// (upgrade track, etc.) — sans ça, Blizzard ne renvoie que les stats de
// base de l'objet, pas celles réellement sur la pièce équipée.
export async function getItemPreview(itemId, bonusIds) {
  try {
    const suffix = bonusIds?.length ? `&bonus_id=${bonusIds.join(":")}` : "";
    const data = await bnetGet(`/data/wow/item/${itemId}?namespace=static-us&locale=fr_FR${suffix}`);
    const p = data.preview_item || {};

    const lines = [];
    if (p.binding?.name) lines.push({ text: p.binding.name, color: "#ffffff" });
    if (p.inventory_type?.name || p.item_subclass?.name) {
      lines.push({
        text: [p.inventory_type?.name, p.item_subclass?.name].filter(Boolean).join(" — "),
        color: "#ffffff",
      });
    }
    if (p.armor?.display?.display_string) {
      lines.push({ text: p.armor.display.display_string, color: rgbToHex(p.armor.display.color) });
    }
    for (const s of p.stats || []) {
      lines.push({ text: s.display?.display_string, color: rgbToHex(s.display?.color) });
    }
    if (p.spells?.length) {
      for (const sp of p.spells) {
        if (sp.description) lines.push({ text: sp.description, color: "#1eff00" });
      }
    }
    if (p.set?.display_string) lines.push({ text: p.set.display_string, color: "#ffd100" });
    if (p.durability?.display_string) {
      lines.push({ text: p.durability.display_string, color: "#ffffff" });
    }
    if (p.requirements?.level?.display_string) {
      lines.push({ text: p.requirements.level.display_string, color: "#ffffff" });
    }

    return { lines };
  } catch {
    return { lines: [] };
  }
}

export async function getSpellIcons(spellIds) {
  const uniqueIds = [...new Set(spellIds)];
  const results = await Promise.all(
    uniqueIds.map(async (id) => {
      try {
        const data = await bnetGet(`/data/wow/media/spell/${id}?namespace=static-us`);
        const icon = data.assets?.find((a) => a.key === "icon")?.value;
        return [id, icon];
      } catch {
        return [id, null];
      }
    })
  );
  return new Map(results.filter(([, url]) => url));
}

// Extrait tous les spellId présents dans une liste de nœuds (rangs simples
// ET nœuds à choix), pour savoir quelles icônes aller chercher.
export function collectSpellIds(nodes) {
  const ids = [];
  for (const node of nodes) {
    for (const rank of node.ranks || []) {
      if (rank.tooltip?.spell_tooltip?.spell?.id) {
        ids.push(rank.tooltip.spell_tooltip.spell.id);
      }
      for (const choice of rank.choice_of_tooltips || []) {
        if (choice.spell_tooltip?.spell?.id) {
          ids.push(choice.spell_tooltip.spell.id);
        }
      }
    }
  }
  return ids;
}
