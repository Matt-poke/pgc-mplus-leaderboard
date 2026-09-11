// Utilitaires partagés pour interroger Warcraft Logs.

let cachedToken = null;
let cachedTokenExpiry = 0;

export async function getAccessToken() {
  // Réutilise le token tant qu'il n'est pas expiré (évite une authentification
  // à chaque appel — les fonctions serverless peuvent réutiliser la mémoire
  // entre deux invocations proches, donc ce cache est un bonus, pas une garantie).
  if (cachedToken && Date.now() < cachedTokenExpiry) {
    return cachedToken;
  }

  const basicAuth = Buffer.from(
    `${process.env.WCL_CLIENT_ID}:${process.env.WCL_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch("https://www.warcraftlogs.com/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`Échec auth WCL : ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  // On retire une petite marge de sécurité (60s) avant l'expiration annoncée.
  cachedTokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

export async function graphql(query, variables = {}) {
  const token = await getAccessToken();
  const res = await fetch("https://www.warcraftlogs.com/api/v2/client", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    throw new Error(`Erreur GraphQL WCL : ${JSON.stringify(json.errors)}`);
  }
  return json.data;
}

let cachedClassNames = null;

// Le classID renvoyé par l'API pour un personnage utilise la numérotation
// interne de Warcraft Logs, pas celle de Blizzard — on la résout donc
// dynamiquement plutôt que de la deviner.
export async function getClassNameById(classID) {
  if (!cachedClassNames) {
    const data = await graphql(`
      query {
        gameData {
          classes {
            id
            name
          }
        }
      }
    `);
    cachedClassNames = new Map(
      (data?.gameData?.classes || []).map((c) => [c.id, c.name])
    );
  }
  return cachedClassNames.get(classID) || null;
}
export async function getSeasonEncounters(zoneId) {
  const data = await graphql(
    `
      query($zoneId: Int!) {
        worldData {
          zone(id: $zoneId) {
            encounters { id name }
          }
        }
      }
    `,
    { zoneId }
  );
  return data?.worldData?.zone?.encounters || [];
}

// Reprend la logique validée manuellement : pour une spé donnée, cumule le
// meilleur score de chaque joueur sur chacun des donjons de la saison, et
// renvoie le joueur en tête avec le détail de son meilleur run individuel
// (talents + stuff).
export async function computeSpecLeader(spec, encounters, rankingsPerDungeon = 50) {
  const players = new Map();

  for (const enc of encounters) {
    const data = await graphql(
      `
        query($encounterId: Int!, $className: String!, $specName: String!) {
          worldData {
            encounter(id: $encounterId) {
              characterRankings(
                className: $className
                specName: $specName
                metric: playerscore
                includeCombatantInfo: true
              )
            }
          }
        }
      `,
      { encounterId: enc.id, className: spec.className, specName: spec.specName }
    );

    const rankings = data?.worldData?.encounter?.characterRankings?.rankings || [];
    const top = rankings.slice(0, rankingsPerDungeon);

    // Ne garder que la meilleure ligne de chaque joueur pour CE donjon.
    const bestPerPlayerThisDungeon = new Map();
    for (const r of top) {
      const key = `${r.name}__${r.server?.name}__${r.server?.region}`;
      const existing = bestPerPlayerThisDungeon.get(key);
      if (!existing || r.score > existing.score) {
        bestPerPlayerThisDungeon.set(key, r);
      }
    }

    for (const [key, r] of bestPerPlayerThisDungeon) {
      if (!players.has(key)) {
        players.set(key, {
          name: r.name,
          server: r.server?.name,
          region: r.server?.region,
          total: 0,
          dungeonsSeen: 0,
          bestRun: null, // le run individuel avec le score le plus haut, pour ses talents/stuff
        });
      }
      const p = players.get(key);
      p.total += r.score;
      p.dungeonsSeen += 1;
      if (!p.bestRun || r.score > p.bestRun.score) {
        p.bestRun = {
          dungeon: enc.name,
          score: r.score,
          hardModeLevel: r.hardModeLevel,
          talents: r.talents,
          gear: r.gear,
          report: {
            code: r.report?.code,
            fightID: r.report?.fightID,
          },
        };
      }
    }
  }

  const sorted = [...players.values()].sort((a, b) => b.total - a.total);
  return sorted[0] || null;
}
