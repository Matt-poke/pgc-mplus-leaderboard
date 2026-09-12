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
