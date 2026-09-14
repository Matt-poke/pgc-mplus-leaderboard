import { NavLink, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Compare from "./pages/Compare.jsx";
import Dungeons from "./pages/Dungeons.jsx";
import DungeonDetail from "./pages/DungeonDetail.jsx";
import "./App.css";

export default function App() {
  return (
    <div className="page">
      <nav className="top-nav">
        <span className="top-nav-brand">M+ Opti</span>
        <div className="top-nav-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            Accueil
          </NavLink>
          <NavLink to="/comparer" className={({ isActive }) => (isActive ? "active" : "")}>
            Comparer mon personnage
          </NavLink>
          <NavLink to="/donjons" className={({ isActive }) => (isActive ? "active" : "")}>
            Donjons
          </NavLink>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/comparer" element={<Compare />} />
        <Route path="/donjons" element={<Dungeons />} />
        <Route path="/donjons/:slug" element={<DungeonDetail />} />
      </Routes>
    </div>
  );
}
