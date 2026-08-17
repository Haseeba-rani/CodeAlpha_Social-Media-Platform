import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const novelRow = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  author: z.string(),
  genres: z.array(z.string()),
  rating: z.number(),
  readers_label: z.string(),
  cover_url: z.string(),
  description: z.string(),
});

export const CATALOG_NOVELS: z.infer<typeof novelRow>[] = [];

export const getNovels = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabase.from("novels").select("*").order("created_at", { ascending: true });
  if (error) {
    console.error("[NovelNest] Failed to fetch novels from DB", error);
    return [];
  }
  return (data ?? []).map((n) => novelRow.parse(n));
});

export const getNovelBySlug = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ slug: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabase.from("novels").select("*").eq("slug", data.slug).limit(1);
    if (!error && rows && rows.length > 0) {
      return novelRow.parse(rows[0]);
    }
    return null;
  });
