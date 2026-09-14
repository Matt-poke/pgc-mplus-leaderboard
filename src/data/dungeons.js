// Un objet par donjon. On commence avec Altar of Fangs comme gabarit —
// les autres donjons suivront le même format une fois validé.
//
// mdtCode et keystoneGuruUrl : à remplir avec les vraies valeurs (ne rien
// inventer ici, ce sont des données fournies par l'utilisateur).
//
// pulls : un objet par numéro de pull visible sur la capture d'écran, avec
// les mobs à surveiller. priority : "kill" (cible prioritaire, crâne sur la
// capture), "kick" (à interrompre), "watch" (dangereux, à surveiller).

export const DUNGEONS = [
  {
    slug: "altar-of-fangs",
    name: "Altar of Fangs",
    screenshot: "/dungeons/altar-of-fangs.png",
    mdtCode: "", // TODO : coller le code d'export MDT
    keystoneGuruUrl: "", // TODO : lien vers la route sur Keystone.guru
    bloodlustNote: "Repère (icône dédiée) visible sur la carte au niveau du pull 8.",
    pulls: [
      // TODO : un objet par pull, ex.
      // { number: 1, mobs: [{ name: "...", priority: "kick", note: "..." }] },
    ],
  },
];
