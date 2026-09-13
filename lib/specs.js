// Liste des spécialisations, avec le nom exact attendu par l'API Warcraft Logs
// (className / specName) et un identifiant stable (slug) pour notre base.
//
// Si une requête échoue pour une spé précise avec une erreur du style
// "does not exist", c'est probablement une coquille ici — on comparera
// avec le filtre de classe/spé sur warcraftlogs.com pour corriger.

export const SPECS = [
  { slug: "warrior-arms", className: "Warrior", specName: "Arms" },
  { slug: "warrior-fury", className: "Warrior", specName: "Fury" },
  { slug: "warrior-protection", className: "Warrior", specName: "Protection" },

  { slug: "paladin-holy", className: "Paladin", specName: "Holy" },
  { slug: "paladin-protection", className: "Paladin", specName: "Protection" },
  { slug: "paladin-retribution", className: "Paladin", specName: "Retribution" },

  { slug: "hunter-beastmastery", className: "Hunter", specName: "BeastMastery" },
  { slug: "hunter-marksmanship", className: "Hunter", specName: "Marksmanship" },
  { slug: "hunter-survival", className: "Hunter", specName: "Survival" },

  { slug: "rogue-assassination", className: "Rogue", specName: "Assassination" },
  { slug: "rogue-outlaw", className: "Rogue", specName: "Outlaw" },
  { slug: "rogue-subtlety", className: "Rogue", specName: "Subtlety" },

  { slug: "priest-discipline", className: "Priest", specName: "Discipline" },
  { slug: "priest-holy", className: "Priest", specName: "Holy" },
  { slug: "priest-shadow", className: "Priest", specName: "Shadow" },

  { slug: "deathknight-blood", className: "DeathKnight", specName: "Blood" },
  { slug: "deathknight-frost", className: "DeathKnight", specName: "Frost" },
  { slug: "deathknight-unholy", className: "DeathKnight", specName: "Unholy" },

  { slug: "shaman-elemental", className: "Shaman", specName: "Elemental" },
  { slug: "shaman-enhancement", className: "Shaman", specName: "Enhancement" },
  { slug: "shaman-restoration", className: "Shaman", specName: "Restoration" },

  { slug: "mage-arcane", className: "Mage", specName: "Arcane" },
  { slug: "mage-fire", className: "Mage", specName: "Fire" },
  { slug: "mage-frost", className: "Mage", specName: "Frost" },

  { slug: "warlock-affliction", className: "Warlock", specName: "Affliction" },
  { slug: "warlock-demonology", className: "Warlock", specName: "Demonology" },
  { slug: "warlock-destruction", className: "Warlock", specName: "Destruction" },

  { slug: "monk-brewmaster", className: "Monk", specName: "Brewmaster" },
  { slug: "monk-mistweaver", className: "Monk", specName: "Mistweaver" },
  { slug: "monk-windwalker", className: "Monk", specName: "Windwalker" },

  { slug: "druid-balance", className: "Druid", specName: "Balance" },
  { slug: "druid-feral", className: "Druid", specName: "Feral" },
  { slug: "druid-guardian", className: "Druid", specName: "Guardian" },
  { slug: "druid-restoration", className: "Druid", specName: "Restoration" },

  { slug: "demonhunter-havoc", className: "DemonHunter", specName: "Havoc" },
  { slug: "demonhunter-vengeance", className: "DemonHunter", specName: "Vengeance" },
  { slug: "demonhunter-devourer", className: "DemonHunter", specName: "Devourer" },

  { slug: "evoker-devastation", className: "Evoker", specName: "Devastation" },
  { slug: "evoker-preservation", className: "Evoker", specName: "Preservation" },
  { slug: "evoker-augmentation", className: "Evoker", specName: "Augmentation" },
];
