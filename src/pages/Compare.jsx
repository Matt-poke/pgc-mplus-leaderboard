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

function GearGrid({ gear, unavailableReason }) {
  if (!gear) return <p className="leader-empty">{unavailableReason || "Indisponible"}</p>;
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

function TalentGrid({ talents, otherNames, unavailableReason }) {
  if (!talents) return <p className="leader-empty">{unavailableReason || "Indisponible"}</p>;

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
  const [reportUrl, setReportUrl] = useState("");
  const [myDamage, setMyDamage] = useState(null);
  const [leaderDamage, setLeaderDamage] = useState(null);
  const [damageError, setDamageError] = useState(null);
  const [damageLoading, setDamageLoading] = useState(false);

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
        const stored = rankings.find((r) => r.spec_slug === slug)?.data || null;
        // Compatibilité avec l'ancien format (avant le tri overall/nonCN)
        leaderRow = stored ? { overall: stored.overall || stored, nonCN: stored.nonCN || stored } : null;
        setLeader(leaderRow);
      }

      const gearTarget = leaderRow?.nonCN;
      const leaderGearPromise = gearTarget
        ? fetchGear(gearTarget.name, realmSlug(gearTarget.server), gearTarget.region)
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

  async function runDamageAnalysis(myCode, myFightID) {
    const leaderDungeon = leader?.overall?.dungeonScores?.find(
      (d) => d.dungeon === selectedDungeon
    );
    if (!leaderDungeon?.report?.code) {
      setDamageError("Le n°1 n'a pas de report exploitable pour ce donjon");
      return;
    }

    setDamageLoading(true);
    try {
      const [mine, theirs] = await Promise.all([
        fetch(
          `/api/damage?code=${myCode}&fightID=${myFightID}&name=${encodeURIComponent(character.name)}`
        ).then((r) => r.json()),
        fetch(
          `/api/damage?code=${leaderDungeon.report.code}&fightID=${leaderDungeon.report.fightID}&name=${encodeURIComponent(leader.overall.name)}`
        ).then((r) => r.json()),
      ]);

      if (mine.error) throw new Error(`Ton report : ${mine.error}`);
      if (theirs.error) throw new Error(`Report du n°1 : ${theirs.error}`);

      setMyDamage(mine);
      setLeaderDamage(theirs);
    } catch (err) {
      setDamageError(err.message);
    } finally {
      setDamageLoading(false);
    }
  }

  async function handleAutoDetect() {
    setDamageError(null);
    setMyDamage(null);
    setLeaderDamage(null);
    setDamageLoading(true);
    try {
      const params = new URLSearchParams({ characterId: character.id, dungeon: selectedDungeon });
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);
      const res = await fetch(`/api/find-report?${params}`, { signal: controller.signal });
      clearTimeout(timeout);
      const found = await res.json();
      if (!res.ok) {
        setDamageLoading(false);
        setDamageError(
          "Aucun rapport trouvé pour ce donjon parmi tes reports récents — essaie un autre donjon, ou colle un lien toi-même ci-dessous."
        );
        return;
      }
      await runDamageAnalysis(found.code, found.fightID);
    } catch (err) {
      setDamageLoading(false);
      if (err.name === "AbortError") {
        setDamageError("La recherche a pris trop de temps — colle un lien toi-même ci-dessous.");
      } else {
        setDamageError(err.message);
      }
    }
  }

  function parseReportUrl(url) {
    // Formats possibles : .../reports/CODE#fight=12  ou  .../reports/CODE?fight=12
    const codeMatch = url.match(/reports\/([a-zA-Z0-9]+)/);
    const fightMatch = url.match(/fight=(\d+)/);
    if (!codeMatch || !fightMatch) return null;
    return { code: codeMatch[1], fightID: Number(fightMatch[1]) };
  }

  async function handleAnalyzeDamage() {
    setDamageError(null);
    setMyDamage(null);
    setLeaderDamage(null);

    const parsed = parseReportUrl(reportUrl);
    if (!parsed) {
      setDamageError("Lien de report non reconnu — colle l'URL complète avec #fight=XX");
      return;
    }

    await runDamageAnalysis(parsed.code, parsed.fightID);
  }

  const classInfo = character ? CLASSES.find((c) => c.name === character.className) : null;
  const specInfo = character
    ? SPECS.find((s) => s.className === character.className && specSlug(character.className, character.mainSpec) === s.slug)
    : null;

  const myTalentNames = new Set((myGear?.talents || []).map((t) => t.name));
  const leaderTalentNames = new Set((leaderGear?.talents || []).map((t) => t.name));

  const leaderScoreForSelection = leader?.overall
    ? selectedDungeon === "season"
      ? leader.overall.total
      : leader.overall.dungeonScores?.find((d) => d.dungeon === selectedDungeon)?.score ?? null
    : null;

  const showingSubstitute =
    leader?.overall && leader?.nonCN && leader.overall.name !== leader.nonCN.name;

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
                onChange={(e) => {
                  setSelectedDungeon(e.target.value);
                  setDamageError(null);
                  setMyDamage(null);
                  setLeaderDamage(null);
                  setReportUrl("");
                }}
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
              const leaderDungeonScore = leader?.overall?.dungeonScores?.find(
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
          {showingSubstitute && (
            <p className="page-subtitle">
              Le vrai n°1 ({leader.overall.name}, serveur chinois) n'a pas de stuff/talents
              disponibles — comparaison de stuff/talents avec {leader.nonCN.name}, le meilleur
              joueur non-chinois.
            </p>
          )}
          <div className="compare-columns">
            <div>
              <p className="compare-total-label">Toi</p>
              <GearGrid gear={myGear} />
            </div>
            <div>
              <p className="compare-total-label">N°1</p>
              <GearGrid
                gear={leaderGear}
                unavailableReason={
                  leader?.overall?.region === "CN" && !leader?.nonCN
                    ? "Non disponible pour les serveurs chinois (API Blizzard fermée depuis 2016)"
                    : null
                }
              />
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
              <TalentGrid
                talents={leaderGear?.talents}
                otherNames={myTalentNames}
                unavailableReason={
                  leader?.overall?.region === "CN" && !leader?.nonCN
                    ? "Non disponible pour les serveurs chinois (API Blizzard fermée depuis 2016)"
                    : null
                }
              />
            </div>
          </div>
          <h3 className="section-subtitle">Ordre et sources de dégâts</h3>
          {selectedDungeon === "season" ? (
            <p className="leader-empty">
              Choisis un donjon précis dans le sélecteur ci-dessus pour analyser tes sorts sur ce
              run.
            </p>
          ) : (
            <>
              <p className="page-subtitle">
                On peut essayer de retrouver automatiquement un de tes reports récents pour{" "}
                {selectedDungeon}, ou tu peux coller un lien toi-même.
              </p>
              <div className="search-form">
                <button type="button" onClick={handleAutoDetect} disabled={damageLoading}>
                  {damageLoading ? "Recherche…" : "Chercher automatiquement"}
                </button>
              </div>
              <form
                className="search-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAnalyzeDamage();
                }}
              >
                <input
                  type="text"
                  placeholder="ou colle un lien : https://www.warcraftlogs.com/reports/XXXXXXXX#fight=9"
                  value={reportUrl}
                  onChange={(e) => setReportUrl(e.target.value)}
                />
                <button type="submit" disabled={damageLoading}>
                  Analyser ce lien
                </button>
              </form>

              {damageError && <p className="leader-empty">{damageError}</p>}

              {myDamage && leaderDamage && (
                <div className="spec-list">
                  <div className="damage-row damage-row-header">
                    <span className="compare-total-label">Sort</span>
                    <span className="compare-total-label">Toi</span>
                    <span className="compare-total-label">N°1 ({leader.overall.name})</span>
                  </div>
                  {[
                    ...new Set([
                      ...myDamage.abilities.map((a) => a.name),
                      ...leaderDamage.abilities.map((a) => a.name),
                    ]),
                  ]
                    .map((name) => ({
                      name,
                      mine: myDamage.abilities.find((a) => a.name === name),
                      theirs: leaderDamage.abilities.find((a) => a.name === name),
                    }))
                    .sort((a, b) => (b.mine?.total || 0) - (a.mine?.total || 0))
                    .map(({ name, mine, theirs }) => (
                      <div className="damage-row" key={name}>
                        <span className="spec-label">{name}</span>
                        <span className="gear-item">
                          {mine ? `${mine.percent.toFixed(1)}% · ${mine.casts} casts` : "—"}
                        </span>
                        <span className="gear-item">
                          {theirs ? `${theirs.percent.toFixed(1)}% · ${theirs.casts} casts` : "—"}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </>
          )}
        </section>
      )}
    </>
  );
}
