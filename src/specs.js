// Copie côté front de la liste des spécialisations (le backend a la sienne,
// utilisée pour interroger Warcraft Logs). Celle-ci sert juste à afficher
// un libellé français et à garder un ordre stable, même pour une spé dont
// les données n'ont pas encore été calculées.
export const SPECS = [
  { slug: "warrior-arms", className: "Warrior", label: "Armes" },
  { slug: "warrior-fury", className: "Warrior", label: "Fureur" },
  { slug: "warrior-protection", className: "Warrior", label: "Protection" },

  { slug: "paladin-holy", className: "Paladin", label: "Sacré" },
  { slug: "paladin-protection", className: "Paladin", label: "Protection" },
  { slug: "paladin-retribution", className: "Paladin", label: "Vindicte" },

  { slug: "hunter-beastmastery", className: "Hunter", label: "Maîtrise des bêtes" },
  { slug: "hunter-marksmanship", className: "Hunter", label: "Précision" },
  { slug: "hunter-survival", className: "Hunter", label: "Survie" },

  { slug: "rogue-assassination", className: "Rogue", label: "Assassinat" },
  { slug: "rogue-outlaw", className: "Rogue", label: "Hors-la-loi" },
  { slug: "rogue-subtlety", className: "Rogue", label: "Finesse" },

  { slug: "priest-discipline", className: "Priest", label: "Discipline" },
  { slug: "priest-holy", className: "Priest", label: "Sacré" },
  { slug: "priest-shadow", className: "Priest", label: "Ombre" },

  { slug: "deathknight-blood", className: "DeathKnight", label: "Sang" },
  { slug: "deathknight-frost", className: "DeathKnight", label: "Givre" },
  { slug: "deathknight-unholy", className: "DeathKnight", label: "Impie" },

  { slug: "shaman-elemental", className: "Shaman", label: "Élémentaire" },
  { slug: "shaman-enhancement", className: "Shaman", label: "Amélioration" },
  { slug: "shaman-restoration", className: "Shaman", label: "Restauration" },

  { slug: "mage-arcane", className: "Mage", label: "Arcanes" },
  { slug: "mage-fire", className: "Mage", label: "Feu" },
  { slug: "mage-frost", className: "Mage", label: "Givre" },

  { slug: "warlock-affliction", className: "Warlock", label: "Affliction" },
  { slug: "warlock-demonology", className: "Warlock", label: "Démonologie" },
  { slug: "warlock-destruction", className: "Warlock", label: "Destruction" },

  { slug: "monk-brewmaster", className: "Monk", label: "Maître brasseur" },
  { slug: "monk-mistweaver", className: "Monk", label: "Tisse-brume" },
  { slug: "monk-windwalker", className: "Monk", label: "Marche-vent" },

  { slug: "druid-balance", className: "Druid", label: "Équilibre" },
  { slug: "druid-feral", className: "Druid", label: "Farouche" },
  { slug: "druid-guardian", className: "Druid", label: "Gardien" },
  { slug: "druid-restoration", className: "Druid", label: "Restauration" },

  { slug: "demonhunter-havoc", className: "DemonHunter", label: "Dévastation" },
  { slug: "demonhunter-vengeance", className: "DemonHunter", label: "Vengeance" },
  { slug: "demonhunter-devourer", className: "DemonHunter", label: "Dévoreur" },

  { slug: "evoker-devastation", className: "Evoker", label: "Dévastation" },
  { slug: "evoker-preservation", className: "Evoker", label: "Préservation" },
  { slug: "evoker-augmentation", className: "Evoker", label: "Augmentation" },
];
