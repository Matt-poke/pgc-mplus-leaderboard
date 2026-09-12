export default async function handler(req, res) {
  try {
    // Authentification (même principe que Warcraft Logs : client_credentials)
    const basicAuth = Buffer.from(
      `${process.env.BATTLENET_CLIENT_ID}:${process.env.BATTLENET_CLIENT_SECRET}`
    ).toString("base64");

    const tokenRes = await fetch("https://oauth.battle.net/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!tokenRes.ok) {
      res.status(500).json({ error: `Échec auth Battle.net : ${tokenRes.status} ${await tokenRes.text()}` });
      return;
    }

    const { access_token } = await tokenRes.json();

    // Index des arbres de talents (données statiques de jeu, région US)
    const treeRes = await fetch(
      "https://us.api.blizzard.com/data/wow/talent-tree/index?namespace=static-us&locale=fr_FR",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    const treeData = await treeRes.json();

    // Test : l'arbre complet Mage (658) pour la spé Arcanes (62)
    const specTreeRes = await fetch(
      "https://us.api.blizzard.com/data/wow/talent-tree/658/playable-specialization/62?namespace=static-us&locale=fr_FR",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    const specTreeData = await specTreeRes.json();

    // Test : l'icône d'un sort précis (Barrière prismatique, spell id 235450)
    const mediaRes = await fetch(
      "https://us.api.blizzard.com/data/wow/media/spell/235450?namespace=static-us&locale=fr_FR",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    const mediaData = await mediaRes.json();

    res.status(200).json({ specTreeSummary: { classNodesCount: specTreeData.class_talent_nodes?.length }, media: mediaData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
