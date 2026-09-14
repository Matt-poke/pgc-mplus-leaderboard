import { Link } from "react-router-dom";
import { DUNGEONS } from "../data/dungeons.js";

export default function Dungeons() {
  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Optimisation par donjon</h1>
          <p className="page-subtitle">Routes, cibles prioritaires et spots de Bloodlust</p>
        </div>
      </header>

      <div className="dungeon-grid">
        {DUNGEONS.map((d) => (
          <Link to={`/donjons/${d.slug}`} className="dungeon-card" key={d.slug}>
            <img src={d.screenshot} alt={d.name} loading="lazy" />
            <span className="dungeon-card-name">{d.name}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
