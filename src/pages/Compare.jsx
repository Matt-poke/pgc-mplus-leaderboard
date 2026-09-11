import { useState } from "react";
import { CLASSES } from "../classes.js";
import { SPECS } from "../specs.js";

function specSlug(className, spec) {
  return `${className.toLowerCase()}-${spec.toLowerCase().replace(/\s+/g, "")}`;
}

export default function Compare() {
  const [form, setForm] = useState({ name: "", server: "", region: "EU" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [character, setCharacter] = useState(null);
  const [leader, setLeader] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCharacter(null);
    setLeader(null);

    try {
      const params = new URLSearchParams(form);
      const res = await fetch(`/api/character?${params}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur inconnue");
      }

      setCharacter(data);

      if (data.mainSpec) {
        const slug = specSlug(data.className, data.mainSpec);
        const rankingsRes = await fetch("/api/rankings");
        const rankings = await rankingsRes.json();
        const row = rankings.find((r) => r.spec_slug === slug);
        setLeader(row?.data || null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const classInfo = character ? CLASSES.find((c) => c.name === character.className) : null;
  const specInfo = character
    ? SPECS.find((s) => s.className === character.className && specSlug(character.className, character.mainSpec) === s.slug)
    : null;

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Comparer mon personnage</h1>
          <p className="page-subtitle">Où tu en es par rapport au n°1 de ta spécialisation</p>
        </div>
      </header>

      <form className="search-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nom du personnage"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="royaume (ex. sinstralis)"
          value={form.server}
          onChange={(e) => setForm({ ...form, server: e.target.value })}
          required
        />
        <select
          value={form.region}
          onChange={(e) => setForm({ ...form, region: e.target.value })}
        >
          <option value="EU">EU</option>
          <option value="US">US</option>
          <option value="KR">KR</option>
          <option value="TW">TW</option>
          <option value="CN">CN</option>
        </select>
        <button type="submit" disabled={loading}>
          {loading ? "Recherche…" : "Comparer"}
        </button>
      </form>

      {error && <p className="leader-empty">{error}</p>}

      {character && (
        <section
          className="class-section"
          style={{ "--class-color": classInfo?.color }}
        >
          <h2 className="class-name">
            {character.name} — {classInfo?.label || character.className}
            {specInfo ? ` (${specInfo.label})` : ""}
          </h2>

          <div className="compare-totals">
            <div className="compare-total-block">
              <span className="compare-total-label">Toi</span>
              <span className="score compare-total-score">{Math.round(character.total)}</span>
            </div>
            <div className="compare-total-block">
              <span className="compare-total-label">N°1 {specInfo?.label || character.mainSpec}</span>
              <span className="score compare-total-score">
                {leader ? Math.round(leader.total) : "—"}
              </span>
            </div>
          </div>

          <div className="spec-list">
            {character.dungeons.map((d) => (
              <div className="spec-row" key={d.dungeon}>
                <span className="spec-label">{d.dungeon}</span>
                <span className="leader-name">{d.spec}</span>
                <span className="region-badge">ilvl {d.itemLevel}</span>
                <span className="score">{Math.round(d.score)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
