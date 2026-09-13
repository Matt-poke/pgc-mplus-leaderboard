import { useEffect, useState } from "react";

const CELL = 40;
const GAP = 10;
const STEP = CELL + GAP;

function pos(node) {
  return { x: node.col * STEP + CELL / 2, y: node.row * STEP + CELL / 2 };
}

function TreeSection({ title, nodes: rawNodes, selectedIds, choiceSpellByNode, showTooltip, hideTooltip }) {
  if (!rawNodes.length) return null;

  // Les coordonnées brutes de Blizzard ne démarrent pas forcément à 0
  // (ex. l'arbre de spé peut commencer à la colonne 9) — on recale tout
  // pour que chaque arbre commence à sa propre origine, sans espace vide.
  const minRow = Math.min(...rawNodes.map((n) => n.row));
  const minCol = Math.min(...rawNodes.map((n) => n.col));
  const nodes = rawNodes.map((n) => ({ ...n, row: n.row - minRow, col: n.col - minCol }));

  const maxRow = Math.max(...nodes.map((n) => n.row)) + 1;
  const maxCol = Math.max(...nodes.map((n) => n.col)) + 1;
  const width = maxCol * STEP;
  const height = maxRow * STEP;
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  const edges = [];
  for (const n of nodes) {
    for (const targetId of n.unlocks) {
      const target = nodeById.get(targetId);
      if (target) edges.push([n, target]);
    }
  }

  return (
    <div>
      <p className="compare-total-label">{title}</p>
      <div className="talent-tree-abs" style={{ width, height }}>
        <svg width={width} height={height} className="talent-tree-svg">
          {edges.map(([a, b], i) => {
            const pa = pos(a);
            const pb = pos(b);
            const active = selectedIds.has(a.id) && selectedIds.has(b.id);
            return (
              <line
                key={i}
                x1={pa.x}
                y1={pa.y}
                x2={pb.x}
                y2={pb.y}
                className={active ? "edge-active" : "edge-dim"}
              />
            );
          })}
        </svg>
        {nodes.map((n) => {
          const p = pos(n);
          const selected = selectedIds.has(n.id);
          let icon = n.icon;
          let label = n.name;
          let description = n.description;

          if (n.isChoice) {
            const chosenSpellId = choiceSpellByNode.get(n.id);
            const opt = n.options.find((o) => o.spellId === chosenSpellId) || n.options[0];
            icon = opt?.icon;
            label = opt?.name;
            description = opt?.description;
          }

          return (
            <div
              key={n.id}
              style={{ position: "absolute", left: p.x - CELL / 2, top: p.y - CELL / 2, width: CELL, height: CELL }}
              onMouseEnter={(e) =>
                showTooltip(
                  e,
                  <>
                    <p className="tooltip-title">{label}</p>
                    {n.isChoice && (
                      <p className="tooltip-line tooltip-choice-note">
                        Choix : {n.options.map((o) => o.name).join(" ou ")}
                      </p>
                    )}
                    {description && <p className="tooltip-line">{description}</p>}
                  </>
                )
              }
              onMouseLeave={hideTooltip}
            >
              <div className={`talent-node ${selected ? "talent-node-selected" : "talent-node-dim"}`}>
                {icon && <img src={icon} alt="" loading="lazy" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TalentTree({ spec, selectedTalents }) {
  const [tree, setTree] = useState(null);
  const [error, setError] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  function showTooltip(e, content) {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ content, x: rect.left + rect.width / 2, y: rect.top });
  }
  function hideTooltip() {
    setTooltip(null);
  }

  useEffect(() => {
    if (!spec) return;
    setTree(null);
    setError(null);
    fetch(`/api/talent-tree?spec=${spec}`)
      .then((res) => res.json().then((body) => ({ ok: res.ok, body })))
      .then(({ ok, body }) => {
        if (body.pending) {
          setError("en cours de préparation, réessaie dans quelques minutes");
          return;
        }
        if (!ok) throw new Error(body.error || "Erreur inconnue");
        setTree(body);
      })
      .catch((err) => setError(err.message));
  }, [spec]);

  if (error) return <p className="leader-empty">Arbre indisponible ({error})</p>;
  if (!tree) return <p className="leader-empty">Chargement de l'arbre…</p>;
  if (!selectedTalents) return <p className="leader-empty">Indisponible</p>;

  const selectedIds = new Set(selectedTalents.map((t) => t.nodeId).filter(Boolean));
  const choiceSpellByNode = new Map(
    selectedTalents.filter((t) => t.nodeId).map((t) => [t.nodeId, t.spellId])
  );

  // L'arbre de héros à afficher : celui dont le joueur a réellement pris
  // des talents (le personnage n'a qu'un seul arbre de héros actif).
  const heroTree =
    tree.heroTrees.find((h) => h.nodes.some((n) => selectedIds.has(n.id))) || tree.heroTrees[0];

  return (
    <div className="talent-layout">
      {heroTree && (
        <div className="talent-hero-row">
          <TreeSection
            title={`Talents de héros — ${heroTree.name}`}
            nodes={heroTree.nodes}
            selectedIds={selectedIds}
            choiceSpellByNode={choiceSpellByNode}
            showTooltip={showTooltip}
            hideTooltip={hideTooltip}
          />
        </div>
      )}
      <div className="talent-main-row">
        <TreeSection
          title="Talents de classe"
          nodes={tree.classNodes}
          selectedIds={selectedIds}
          choiceSpellByNode={choiceSpellByNode}
          showTooltip={showTooltip}
          hideTooltip={hideTooltip}
        />
        <TreeSection
          title="Talents de spécialisation"
          nodes={tree.specNodes}
          selectedIds={selectedIds}
          choiceSpellByNode={choiceSpellByNode}
          showTooltip={showTooltip}
          hideTooltip={hideTooltip}
        />
      </div>
      {tooltip && (
        <div className="floating-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
          {tooltip.content}
        </div>
      )}
    </div>
  );
}
