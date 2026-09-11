import { useEffect, useState } from "react";
import { CLASSES } from "./classes.js";
import { SPECS } from "./specs.js";
import "./App.css";

function timeAgo(isoString) {
  if (!isoString) return null;
  const diffMs = Date.now() - new Date(isoString).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  return `il y a ${days} j`;
}

export default function App() {
  const [rankingsBySlug, setRankingsBySlug] = useState({});
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/rankings")
      .then((res) => {
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        return res.json();
      })
      .then((rows) => {
        const bySlug = {};
        let mostRecent = null;
        for (const row of rows) {
          bySlug[row.spec_slug] = row;
          if (!mostRecent || row.updated_at > mostRecent) mostRecent = row.updated_at;
        }
        setRankingsBySlug(bySlug);
        setLastUpdate(mostRecent);
      })
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Top Mythic+ par spécialisation</h1>
          <p className="page-subtitle">Le meilleur score cumulé de la saison, pour chaque spécialisation</p>
        </div>
        {lastUpdate && (
          <span className="updated-note">Mis à jour {timeAgo(lastUpdate)}</span>
        )}
      </header>

      {error && <p className="leader-empty">Impossible de charger les données ({error}).</p>}

      {CLASSES.map((cls) => {
        const specsForClass = SPECS.filter((s) => s.className === cls.name);
        return (
          <section
            key={cls.name}
            className="class-section"
            style={{ "--class-color": cls.color }}
          >
            <h2 className="class-name">{cls.label}</h2>
            <div className="spec-list">
              {specsForClass.map((spec) => {
                const row = rankingsBySlug[spec.slug];
                const leader = row?.data;
                return (
                  <div className="spec-row" key={spec.slug}>
                    <span className="spec-label">{spec.label}</span>
                    {leader ? (
                      <span className="leader-name">{leader.name}</span>
                    ) : (
                      <span className="leader-empty">en cours de calcul…</span>
                    )}
                    {leader?.region && <span className="region-badge">{leader.region}</span>}
                    {leader?.total && (
                      <span className="score">{Math.round(leader.total)}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
