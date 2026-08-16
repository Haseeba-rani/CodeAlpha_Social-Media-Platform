import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const novelRow = z.object({
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

export const getNovels = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabase.from("novels").select("*").order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return z.array(novelRow).parse(data ?? []);
});

export const getNovelBySlug = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ slug: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabase.from("novels").select("*").eq("slug", data.slug).limit(1);
    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) return null;
    return novelRow.parse(rows[0]);
  });
