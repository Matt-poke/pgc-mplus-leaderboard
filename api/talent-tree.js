import { getFullTalentTree, getSpellIcons, collectSpellIds } from "./_blizzard.js";
import { TALENT_TREE_IDS } from "./_talent_ids.js";

// Met un nœud brut de l'API Blizzard dans une forme simple pour le front :
// un rang unique, ou une liste de choix, chacun avec nom + icône + id de
// sort (pour le faire correspondre aux talents choisis par un joueur).
function simplifyNode(node, icons) {
  const base = {
    id: node.id,
    row: node.display_row,
    col: node.display_col,
    type: node.node_type?.type,
    unlocks: node.unlocks || [],
    lockedBy: node.locked_by || [],
  };

  const firstRank = node.ranks?.[0];
  if (firstRank?.choice_of_tooltips) {
    return {
      ...base,
      isChoice: true,
      maxRanks: 1,
      options: firstRank.choice_of_tooltips.map((c) => ({
        spellId: c.spell_tooltip?.spell?.id,
        name: c.talent?.name,
        icon: icons.get(c.spell_tooltip?.spell?.id) || null,
        description: c.spell_tooltip?.description || null,
      })),
    };
  }

  return {
    ...base,
    isChoice: false,
    maxRanks: node.ranks?.length || 1,
    spellId: firstRank?.tooltip?.spell_tooltip?.spell?.id,
    name: firstRank?.tooltip?.talent?.name,
    icon: icons.get(firstRank?.tooltip?.spell_tooltip?.spell?.id) || null,
    description: firstRank?.tooltip?.spell_tooltip?.description || null,
  };
}

export default async function handler(req, res) {
  const { spec } = req.query;
  const ids = TALENT_TREE_IDS[spec];

  if (!ids) {
    res.status(400).json({ error: `Spécialisation inconnue : ${spec}` });
    return;
  }

  try {
    const tree = await getFullTalentTree(ids.treeId, ids.specId);

    const allNodes = [...tree.classNodes, ...tree.specNodes, ...tree.heroTrees.flatMap((t) => t.nodes)];
    const spellIds = collectSpellIds(allNodes);
    const icons = await getSpellIcons(spellIds);

    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
    res.status(200).json({
      classNodes: tree.classNodes.map((n) => simplifyNode(n, icons)),
      specNodes: tree.specNodes.map((n) => simplifyNode(n, icons)),
      heroTrees: tree.heroTrees.map((t) => ({
        id: t.id,
        name: t.name,
        nodes: t.nodes.map((n) => simplifyNode(n, icons)),
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
