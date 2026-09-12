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

const QUALITY_COLORS = {
  0: "#9d9d9d",
  1: "#ffffff",
  2: "#1eff00",
  3: "#0070dd",
  4: "#a335ee",
  5: "#ff8000",
};

function iconUrl(icon, size = "medium") {
  return `https://wow.zamimg.com/images/wow/icons/${size}/${icon}.jpg`;
}

function realmSlug(displayName) {
  if (!displayName) return "";
  return displayName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/'/g, "")
    .replace(/\s+/g, "-");
}

function specSlug(className, spec) {
  return `${className.toLowerCase()}-${spec.toLowerCase().replace(/\s+/g, "")}`;
}

function GearGrid({ gear }) {
  if (!gear) return <p className="leader-empty">Indisponible</p>;
  return (
    <div className="icon-grid">
      {gear.gearSlots.map((item) => (
        <div
          className="icon-tile"
          key={item.slot}
          style={{ "--quality-color": QUALITY_COLORS[item.quality] || QUALITY_COLORS[1] }}
          title={`${item.name} (${item.itemLevel})`}
        >
          <img src={iconUrl(item.icon)} alt={item.name} loading="lazy" />
          <span className="icon-badge">{item.itemLevel}</span>
        </div>
      ))}
    </div>
  );
}

function TalentGrid({ talents, otherNames }) {
  if (!talents) return <p className="leader-empty">Indisponible</p>;

  const groups = [
    { label: "Talents de héros", items: talents.filter((t) => t.isHero) },
    { label: "Talents de classe / spé", items: talents.filter((t) => !t.isHero) },
  ];

  return (
    <>
      {groups.map((g) => {
        if (g.items.length === 0) return null;
        const maxRow = Math.max(...g.items.map((t) => t.row)) + 1;
        const maxCol = Math.max(...g.items.map((t) => t.col)) + 1;
        return (
          <div key={g.label}>
            <p className="compare-total-label">{g.label}</p>
            <div
              className="talent-tree"
              style={{
                gridTemplateRows: `repeat(${maxRow}, 2.6rem)`,
                gridTemplateColumns: `repeat(${maxCol}, 2.6rem)`,
              }}
            >
              {g.items.map((t) => {
                const unique = otherNames && !otherNames.has(t.name);
                return (
                  <div
                    className={`icon-tile${unique ? " icon-tile-unique" : ""}`}
                    key={t.name}
                    title={t.name}
                    style={{ gridRow: t.row + 1, gridColumn: t.col + 1 }}
                  >
                    <img src={iconUrl(t.icon)} alt={t.name} loading="lazy" />
                    {t.maxRanks > 1 && <span className="icon-badge">{t.rank}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}

export default function Compare() {
  const [form, setForm] = useState({ name: "", server: "", region: "EU" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [character, setCharacter] = useState(null);
  const [leader, setLeader] = useState(null);
  const [myGear, setMyGear] = useState(null);
  const [leaderGear, setLeaderGear] = useState(null);
  const [selectedDungeon, setSelectedDungeon] = useState("season");

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
    setSelectedDungeon("season");

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

  const myTalentNames = new Set((myGear?.talents || []).map((t) => t.name));
  const leaderTalentNames = new Set((leaderGear?.talents || []).map((t) => t.name));

  const leaderScoreForSelection = leader
    ? selectedDungeon === "season"
      ? leader.total
      : leader.dungeonScores?.find((d) => d.dungeon === selectedDungeon)?.score ?? null
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
              <span className="score compare-total-score">
                {Math.round(
                  selectedDungeon === "season"
                    ? character.total
                    : character.dungeons.find((d) => d.dungeon === selectedDungeon)?.score || 0
                )}
              </span>
            </div>
            <div className="compare-total-block">
              <span className="compare-total-label">N°1 {specInfo?.label || character.mainSpec}</span>
              <span className="score compare-total-score">
                {leaderScoreForSelection !== null ? Math.round(leaderScoreForSelection) : "—"}
              </span>
            </div>
            <div className="compare-total-block">
              <label className="compare-total-label" htmlFor="dungeon-select">
                Comparer sur
              </label>
              <select
                id="dungeon-select"
                value={selectedDungeon}
                onChange={(e) => setSelectedDungeon(e.target.value)}
              >
                <option value="season">Saison (cumulé)</option>
                {character.dungeons.map((d) => (
                  <option key={d.dungeon} value={d.dungeon}>
                    {d.dungeon}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <h3 className="section-subtitle">Score par donjon</h3>
          <div className="spec-list">
            {character.dungeons.map((d) => {
              const leaderDungeonScore = leader?.dungeonScores?.find(
                (ld) => ld.dungeon === d.dungeon
              )?.score;
              return (
                <div className="spec-row" key={d.dungeon}>
                  <span className="spec-label">{d.dungeon}</span>
                  <span className="leader-name">{d.spec}</span>
                  <span className="score">{Math.round(d.score)}</span>
                  <span className="score">
                    {leaderDungeonScore !== undefined ? Math.round(leaderDungeonScore) : "—"}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="page-subtitle compare-columns-caption">Toi (3e colonne) vs n°1 (4e colonne)</p>

          <h3 className="section-subtitle">
            Stuff — toi ({myGear?.itemLevelEquipped?.toFixed(0) ?? "—"} ilvl) vs n°1 (
            {leaderGear?.itemLevelEquipped?.toFixed(0) ?? "—"} ilvl)
          </h3>
          <div className="compare-columns">
            <div>
              <p className="compare-total-label">Toi</p>
              <GearGrid gear={myGear} />
            </div>
            <div>
              <p className="compare-total-label">N°1</p>
              <GearGrid gear={leaderGear} />
            </div>
          </div>

          <h3 className="section-subtitle">Talents</h3>
          <p className="page-subtitle">Un liseré coloré signale un talent que l'autre n'a pas pris</p>
          <div className="compare-columns">
            <div>
              <p className="compare-total-label">Toi</p>
              <TalentGrid talents={myGear?.talents} otherNames={leaderTalentNames} />
            </div>
            <div>
              <p className="compare-total-label">N°1</p>
              <TalentGrid talents={leaderGear?.talents} otherNames={myTalentNames} />
            </div>
          </div>
        </section>
      )}
    </>
  );
}
