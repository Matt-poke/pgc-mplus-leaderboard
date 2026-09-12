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
    res.status(200).json(treeData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
