import { createClient } from "@supabase/supabase-js";
import { SPECS } from "./_specs.js";
import { getSeasonEncounters, computeSpecLeader } from "./_wcl.js";

// Combien de spécialisations on traite par appel. Avec 8 requêtes par spé,
// UNE SEULE spé par appel reste confortablement sous la limite de 30s de
// cron-job.org (qui remplace GitHub Actions, trop peu fiable en fréquence).
const BATCH_SIZE = 1;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Protection : seul un appelant connaissant le secret peut déclencher un
  // rafraîchissement (sinon n'importe qui pourrait épuiser notre quota WCL).
  const providedSecret = req.headers["x-refresh-secret"] || req.query.secret;
  if (providedSecret !== process.env.REFRESH_SECRET) {
    res.status(401).json({ error: "Non autorisé" });
    return;
  }

  try {
    const zoneId = Number(process.env.WCL_ZONE_ID || 55);

    // 1. Où en était-on ? (curseur stocké comme une ligne spéciale dans la table)
    const { data: cursorRow, error: cursorReadError } = await supabase
      .from("spec_rankings")
      .select("data")
      .eq("spec_slug", "_cursor")
      .maybeSingle();

    if (cursorReadError) {
      throw new Error(`Échec lecture du curseur : ${cursorReadError.message}`);
    }

    const startIndex = cursorRow?.data?.index || 0;

    // 2. Le lot de spés à traiter cette fois, avec retour au début si on
    //    atteint la fin de la liste.
    const batch = [];
    for (let i = 0; i < BATCH_SIZE; i++) {
      batch.push(SPECS[(startIndex + i) % SPECS.length]);
    }

    // 3. La liste des donjons de la saison (une seule requête, réutilisée
    //    pour toutes les spés du lot).
    const encounters = await getSeasonEncounters(zoneId);

    // 4. Calcul + écriture en base, une spé à la fois.
    const results = [];
    for (const spec of batch) {
      const leader = await computeSpecLeader(spec, encounters);

      const { error: upsertError } = await supabase.from("spec_rankings").upsert({
        spec_slug: spec.slug,
        class_name: spec.className,
        spec_name: spec.specName,
        data: leader,
        updated_at: new Date().toISOString(),
      });

      if (upsertError) {
        throw new Error(`Échec écriture Supabase pour ${spec.slug} : ${upsertError.message}`);
      }

      results.push({ spec: spec.slug, leader: leader?.name || "(aucun trouvé)" });
    }

    // 5. On avance le curseur pour le prochain appel.
    const nextIndex = (startIndex + BATCH_SIZE) % SPECS.length;
    const { error: cursorError } = await supabase.from("spec_rankings").upsert({
      spec_slug: "_cursor",
      class_name: "_meta",
      spec_name: "_meta",
      data: { index: nextIndex },
      updated_at: new Date().toISOString(),
    });

    if (cursorError) {
      throw new Error(`Échec écriture du curseur : ${cursorError.message}`);
    }

    res.status(200).json({ ok: true, processed: results, nextIndex });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
