import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  const { spec } = req.query;

  if (!spec) {
    res.status(400).json({ error: "Paramètre requis : spec" });
    return;
  }

  const { data, error } = await supabase
    .from("talent_trees")
    .select("status, data")
    .eq("spec_slug", spec)
    .maybeSingle();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  if (!data || data.status !== "done") {
    res.status(202).json({ pending: true, message: "Arbre en cours de préparation, réessaie dans quelques minutes." });
    return;
  }

  res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
  res.status(200).json(data.data);
}
