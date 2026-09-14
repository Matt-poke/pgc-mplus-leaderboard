import { createClient } from "@supabase/supabase-js";
import { getFullTalentTree, getSpellIcons, collectSpellIds } from "../lib/blizzard.js";
import { TALENT_TREE_IDS } from "../lib/talent_ids.js";

const ICONS_PER_CALL = 50; // récupérées en parallèle, donc ça reste rapide malgré le nombre
const SPEC_SLUGS = Object.keys(TALENT_TREE_IDS);

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function simplifyNode(node, iconsMap) {
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
        icon: iconsMap[c.spell_tooltip?.spell?.id] || null,
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
    icon: iconsMap[firstRank?.tooltip?.spell_tooltip?.spell?.id] || null,
    description: firstRank?.tooltip?.spell_tooltip?.description || null,
  };
}

export default async function handler(req, res) {
  const providedSecret = req.headers["x-refresh-secret"] || req.query.secret;
  if (providedSecret !== process.env.REFRESH_SECRET) {
    res.status(401).json({ error: "Non autorisé" });
    return;
  }

  try {
    // 1. Où en était-on ? (curseur = index dans la liste des spés)
    const { data: cursorRow, error: cursorErr } = await supabase
      .from("talent_trees")
      .select("data")
      .eq("spec_slug", "_cursor")
      .maybeSingle();
    if (cursorErr) throw new Error(`Lecture curseur : ${cursorErr.message}`);

    const specIndex = cursorRow?.data?.index || 0;
    const slug = SPEC_SLUGS[specIndex % SPEC_SLUGS.length];
    const ids = TALENT_TREE_IDS[slug];

    // 2. Où en est CETTE spé précisément ?
    const { data: specRow, error: specErr } = await supabase
      .from("talent_trees")
      .select("*")
      .eq("spec_slug", slug)
      .maybeSingle();
    if (specErr) throw new Error(`Lecture spé ${slug} : ${specErr.message}`);

    let rawTree = specRow?.data?.rawTree;
    let iconQueue = specRow?.icon_queue;
    let icons = specRow?.icons || {};

    // Première fois qu'on voit cette spé : on récupère la structure brute et
    // on construit la file d'attente des icônes à aller chercher.
    if (!rawTree) {
      const tree = await getFullTalentTree(ids.treeId, ids.specId);
      rawTree = tree;
      const allNodes = [...tree.classNodes, ...tree.specNodes, ...tree.heroTrees.flatMap((t) => t.nodes)];
      iconQueue = [...new Set(collectSpellIds(allNodes))];
      icons = {};
    }

    // 3. On traite un petit lot d'icônes.
    const batch = iconQueue.slice(0, ICONS_PER_CALL);
    const rest = iconQueue.slice(ICONS_PER_CALL);
    const newIcons = await getSpellIcons(batch);
    for (const [id, url] of newIcons) icons[id] = url;

    let status = "pending";
    let finalData = null;

    if (rest.length === 0) {
      // Fini pour cette spé : on assemble le résultat final prêt à servir.
      status = "done";
      finalData = {
        classNodes: rawTree.classNodes.map((n) => simplifyNode(n, icons)),
        specNodes: rawTree.specNodes.map((n) => simplifyNode(n, icons)),
        heroTrees: rawTree.heroTrees.map((t) => ({
          id: t.id,
          name: t.name,
          nodes: t.nodes.map((n) => simplifyNode(n, icons)),
        })),
      };

      // On avance le curseur vers la spé suivante.
      const nextIndex = (specIndex + 1) % SPEC_SLUGS.length;
      const { error: cursorWriteErr } = await supabase.from("talent_trees").upsert({
        spec_slug: "_cursor",
        status: "meta",
        data: { index: nextIndex },
        updated_at: new Date().toISOString(),
      });
      if (cursorWriteErr) throw new Error(`Écriture curseur : ${cursorWriteErr.message}`);
    }

    const { error: upsertErr } = await supabase.from("talent_trees").upsert({
      spec_slug: slug,
      status,
      data: status === "done" ? finalData : { rawTree },
      icon_queue: rest,
      icons,
      updated_at: new Date().toISOString(),
    });
    if (upsertErr) throw new Error(`Écriture spé ${slug} : ${upsertErr.message}`);

    res.status(200).json({
      ok: true,
      spec: slug,
      status,
      iconsProcessed: batch.length,
      iconsRemaining: rest.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
