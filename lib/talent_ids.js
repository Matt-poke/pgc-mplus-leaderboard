// Pour chaque spécialisation, l'identifiant de l'arbre de talents (treeId,
// commun à toute la classe) et l'identifiant de la spécialisation
// (specId), tels qu'utilisés par l'API Blizzard :
// /data/wow/talent-tree/{treeId}/playable-specialization/{specId}
export const TALENT_TREE_IDS = {
  "warrior-arms": { treeId: 850, specId: 71 },
  "warrior-fury": { treeId: 850, specId: 72 },
  "warrior-protection": { treeId: 850, specId: 73 },

  "paladin-holy": { treeId: 790, specId: 65 },
  "paladin-protection": { treeId: 790, specId: 66 },
  "paladin-retribution": { treeId: 790, specId: 70 },

  "hunter-beastmastery": { treeId: 774, specId: 253 },
  "hunter-marksmanship": { treeId: 774, specId: 254 },
  "hunter-survival": { treeId: 774, specId: 255 },

  "rogue-assassination": { treeId: 852, specId: 259 },
  "rogue-outlaw": { treeId: 852, specId: 260 },
  "rogue-subtlety": { treeId: 852, specId: 261 },

  "priest-discipline": { treeId: 795, specId: 256 },
  "priest-holy": { treeId: 795, specId: 257 },
  "priest-shadow": { treeId: 795, specId: 258 },

  "deathknight-blood": { treeId: 750, specId: 250 },
  "deathknight-frost": { treeId: 750, specId: 251 },
  "deathknight-unholy": { treeId: 750, specId: 252 },

  "shaman-elemental": { treeId: 786, specId: 262 },
  "shaman-enhancement": { treeId: 786, specId: 263 },
  "shaman-restoration": { treeId: 786, specId: 264 },

  "mage-arcane": { treeId: 658, specId: 62 },
  "mage-fire": { treeId: 658, specId: 63 },
  "mage-frost": { treeId: 658, specId: 64 },

  "warlock-affliction": { treeId: 720, specId: 265 },
  "warlock-demonology": { treeId: 720, specId: 266 },
  "warlock-destruction": { treeId: 720, specId: 267 },

  "monk-brewmaster": { treeId: 1000, specId: 268 },
  "monk-mistweaver": { treeId: 1000, specId: 270 },
  "monk-windwalker": { treeId: 1000, specId: 269 },

  "druid-balance": { treeId: 793, specId: 102 },
  "druid-feral": { treeId: 793, specId: 103 },
  "druid-guardian": { treeId: 793, specId: 104 },
  "druid-restoration": { treeId: 793, specId: 105 },

  "demonhunter-havoc": { treeId: 854, specId: 577 },
  "demonhunter-vengeance": { treeId: 854, specId: 581 },
  "demonhunter-devourer": { treeId: 854, specId: 1480 },

  "evoker-devastation": { treeId: 872, specId: 1467 },
  "evoker-preservation": { treeId: 872, specId: 1468 },
  "evoker-augmentation": { treeId: 872, specId: 1473 },
};
