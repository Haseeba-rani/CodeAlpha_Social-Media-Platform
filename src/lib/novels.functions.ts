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

export const CATALOG_NOVELS: z.infer<typeof novelRow>[] = [
  {
    id: "a1b2c3d4-0001-4000-8000-000000000001",
    title: "It Ends with Us",
    author: "Colleen Hoover",
    slug: "it-ends-with-us",
    rating: 4.6,
    readers_label: "2,840",
    genres: ["Romance", "Drama"],
    cover_url: "/cover-5.jpg",
    description:
      "Lily hasn't always had it easy, but that's never stopped her from working hard for the life she wants. When she feels a spark with a handsome neurosurgeon named Ryle Kincaid, everything in Lily's life suddenly seems almost too good to be true. A courageous and deeply emotional novel about resilience, love, and the strength it takes to break the cycle.",
  },
  {
    id: "a1b2c3d4-0002-4000-8000-000000000002",
    title: "Until Love Sets Us Apart",
    author: "Aditya Nighhot",
    slug: "until-love-sets-us-apart",
    rating: 4.5,
    readers_label: "1,420",
    genres: ["Romance", "Drama", "Thriller"],
    cover_url: "/cover-6.jpg",
    description:
      "Can love survive when fate turns ruthless? Rohit and Aisha believe their bond is unbreakable until a devastating twist of events shatters their world. A poignant, emotionally gripping saga of romance, sacrifice, and the enduring resilience of the human heart through trials of love and tragedy.",
  },
  {
    id: "a1b2c3d4-0003-4000-8000-000000000003",
    title: "The Forty Rules of Love",
    author: "Elif Shafak",
    slug: "the-forty-rules-of-love",
    rating: 4.7,
    readers_label: "3,150",
    genres: ["Spiritual", "Historical", "Literary"],
    cover_url: "/cover-7.jpg",
    description:
      "Ella Rubinstein is an unfulfilled housewife who takes a job as a reader for a literary agent. Her first assignment, Sweet Blasphemy, chronicles the profound 13th-century spiritual friendship between the poet Rumi and the wandering mystic Shams of Tabriz. A timeless masterpiece exploring the transformative power of divine and earthly love.",
  },
  {
    id: "a1b2c3d4-0004-4000-8000-000000000004",
    title: "I Don't Love You Anymore",
    author: "Rithvik Singh",
    slug: "i-dont-love-you-anymore",
    rating: 4.5,
    readers_label: "1,890",
    genres: ["Romance", "Poetry", "Drama"],
    cover_url: "/cover-8.jpg",
    description:
      "A comforting and deeply relatable collection of poetry and prose for anyone healing from heartbreak, unspoken grief, and learning to let go. Rithvik Singh's gentle, honest words remind us that choosing self-worth and moving on is an act of courage, offering solace to weary hearts discovering light after painful goodbyes.",
  },
];

export const getNovels = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabase.from("novels").select("*").order("created_at", { ascending: true });
  if (error) {
    console.error("[NovelNest] Failed to fetch novels from DB, serving catalog", error);
    return CATALOG_NOVELS;
  }
  const dbRows = (data ?? []).map((n) => novelRow.parse(n));
  const existingSlugs = new Set(dbRows.map((n) => n.slug));
  const missingCatalog = CATALOG_NOVELS.filter((n) => !existingSlugs.has(n.slug));
  return [...dbRows, ...missingCatalog];
});

export const getNovelBySlug = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ slug: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabase.from("novels").select("*").eq("slug", data.slug).limit(1);
    if (!error && rows && rows.length > 0) {
      return novelRow.parse(rows[0]);
    }
    const catalogMatch = CATALOG_NOVELS.find((n) => n.slug === data.slug);
    return catalogMatch ?? null;
  });

