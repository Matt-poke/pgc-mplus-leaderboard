import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { DUNGEONS } from "../data/dungeons.js";

const PRIORITY_LABELS = {
  kill: { label: "Prioritaire", color: "#ff4d4d" },
  kick: { label: "À interrompre", color: "#f5d76e" },
  watch: { label: "À surveiller", color: "#69ccf0" },
};

export default function DungeonDetail() {
  const { slug } = useParams();
  const dungeon = DUNGEONS.find((d) => d.slug === slug);
  const [copied, setCopied] = useState(false);

  if (!dungeon) {
    return <p className="leader-empty">Donjon introuvable.</p>;
  }

  function copyMdt() {
    navigator.clipboard.writeText(dungeon.mdtCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <header className="page-header">
        <div>
          <Link to="/donjons" className="page-subtitle">
            ← Tous les donjons
          </Link>
          <h1 className="page-title">{dungeon.name}</h1>
        </div>
      </header>

      <img src={dungeon.screenshot} alt={dungeon.name} className="dungeon-screenshot" />

      <div className="dungeon-actions">
        <button className="dungeon-action-btn" onClick={copyMdt} disabled={!dungeon.mdtCode}>
          {copied ? "Copié !" : "Copier le code MDT"}
        </button>
        {dungeon.keystoneGuruUrl && (
          <a
            href={dungeon.keystoneGuruUrl}
            target="_blank"
            rel="noreferrer"
            className="dungeon-action-btn dungeon-action-link"
          >
            Voir/adapter sur Keystone.guru ↗
          </a>
        )}
      </div>

      {dungeon.bloodlustNote && (
        <div className="leader-empty dungeon-bl-note">
          <strong>Bloodlust —</strong> {dungeon.bloodlustNote}
        </div>
      )}

      {dungeon.pulls.length > 0 && (
        <>
          <h3 className="section-subtitle">Pulls et cibles prioritaires</h3>
          <div className="spec-list">
            {dungeon.pulls.map((p) => (
              <div className="pull-row" key={p.number}>
                <span className="pull-number">{p.number}</span>
                <div className="pull-mobs">
                  {p.mobs.map((m, i) => (
                    <span
                      className="pull-mob"
                      key={i}
                      style={{ "--priority-color": PRIORITY_LABELS[m.priority]?.color }}
                    >
                      <span className="pull-mob-name">{m.name}</span>
                      <span className="pull-mob-tag">{PRIORITY_LABELS[m.priority]?.label}</span>
                      {m.note && <span className="pull-mob-note">{m.note}</span>}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
