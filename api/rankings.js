import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { data, error } = await supabase
    .from("spec_rankings")
    .select("spec_slug, class_name, spec_name, data, updated_at")
    .neq("spec_slug", "_cursor") // on ne veut pas exposer la ligne technique du curseur
    .order("class_name", { ascending: true });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  // Le front n'a pas besoin de recalculer quoi que ce soit — on renvoie
  // directement ce qui est en base.
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  res.status(200).json(data);
}
