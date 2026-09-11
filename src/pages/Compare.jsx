import { useState } from "react";
import { CLASSES } from "../classes.js";
import { SPECS } from "../specs.js";

const SLOT_LABELS = {
  head: "Tête",
  neck: "Cou",
  shoulder: "Épaules",
  back: "Dos",
  chest: "Torse",
  waist: "Taille",
  wrist: "Poignets",
  hands: "Mains",
  legs: "Jambes",
  feet: "Pieds",
  finger1: "Anneau 1",
  finger2: "Anneau 2",
  trinket1: "Babiole 1",
  trinket2: "Babiole 2",
  mainhand: "Main principale",
  offhand: "Main secondaire",
};

function realmSlug(displayName) {
  if (!displayName) return "";
  return displayName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // accents
    .replace(/'/g, "")
    .replace(/\s+/g, "-");
}

function specSlug(className, spec) {
  return `${className.toLowerCase()}-${spec.toLowerCase().replace(/\s+/g, "")}`;
}

export default function Compare() {
  const [form, setForm] = useState({ name: "", server: "", region: "EU" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [character, setCharacter] = useState(null);
  const [leader, setLeader] = useState(null);
  const [myGear, setMyGear] = useState(null);
  const [leaderGear, setLeaderGear] = useState(null);

  async function fetchGear(name, server, region) {
    const params = new URLSearchParams({ name, server, region });
    const res = await fetch(`/api/gear?${params}`);
    if (!res.ok) return null;
    return res.json();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCharacter(null);
    setLeader(null);
    setMyGear(null);
    setLeaderGear(null);

    try {
      const params = new URLSearchParams(form);
      const res = await fetch(`/api/character?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur inconnue");
      setCharacter(data);

      const myGearPromise = fetchGear(form.name, form.server, form.region);

      let leaderRow = null;
      if (data.mainSpec) {
        const slug = specSlug(data.className, data.mainSpec);
        const rankingsRes = await fetch("/api/rankings");
        const rankings = await rankingsRes.json();
        leaderRow = rankings.find((r) => r.spec_slug === slug)?.data || null;
        setLeader(leaderRow);
      }

      const leaderGearPromise = leaderRow
        ? fetchGear(leaderRow.name, realmSlug(leaderRow.server), leaderRow.region)
        : Promise.resolve(null);

      const [myG, leaderG] = await Promise.all([myGearPromise, leaderGearPromise]);
      setMyGear(myG);
      setLeaderGear(leaderG);
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

  const allSlots = myGear || leaderGear
    ? [...new Set([...(myGear?.gearSlots || []), ...(leaderGear?.gearSlots || [])].map((g) => g.slot))]
    : [];

  const myTalents = new Set(myGear?.talentNames || []);
  const leaderTalents = new Set(leaderGear?.talentNames || []);
  const onlyMine = (myGear?.talentNames || []).filter((t) => !leaderTalents.has(t));
  const onlyLeader = (leaderGear?.talentNames || []).filter((t) => !myTalents.has(t));

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

          <h3 className="section-subtitle">Score par donjon</h3>
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

          {(myGear || leaderGear) && (
            <>
              <h3 className="section-subtitle">
                Stuff — toi ({myGear?.itemLevelEquipped?.toFixed(0) ?? "—"} ilvl) vs n°1 (
                {leaderGear?.itemLevelEquipped?.toFixed(0) ?? "—"} ilvl)
              </h3>
              <div className="spec-list">
                {allSlots.map((slot) => {
                  const mine = myGear?.gearSlots.find((g) => g.slot === slot);
                  const theirs = leaderGear?.gearSlots.find((g) => g.slot === slot);
                  return (
                    <div className="gear-row" key={slot}>
                      <span className="spec-label">{SLOT_LABELS[slot] || slot}</span>
                      <span className="gear-item">{mine ? `${mine.name} (${mine.itemLevel})` : "—"}</span>
                      <span className="gear-item">{theirs ? `${theirs.name} (${theirs.itemLevel})` : "—"}</span>
                    </div>
                  );
                })}
              </div>

              <h3 className="section-subtitle">Différences de talents</h3>
              <div className="talent-diff">
                <div>
                  <p className="compare-total-label">Toi seul(e)</p>
                  {onlyMine.length === 0 ? (
                    <p className="leader-empty">Aucune différence</p>
                  ) : (
                    <ul>
                      {onlyMine.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="compare-total-label">N°1 seul(e)</p>
                  {onlyLeader.length === 0 ? (
                    <p className="leader-empty">Aucune différence</p>
                  ) : (
                    <ul>
                      {onlyLeader.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      )}
    </>
  );
}
