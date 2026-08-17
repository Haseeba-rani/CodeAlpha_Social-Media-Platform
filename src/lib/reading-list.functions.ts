import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const readingListItem = z.object({
  id: z.string().uuid(),
  novel_id: z.string().uuid(),
  created_at: z.string(),
});

export const getReadingList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("reading_list")
      .select("id, novel_id, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return z.array(readingListItem).parse(data ?? []);
  });

export const addToReadingList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ novelId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("reading_list").insert({
      user_id: context.userId,
      novel_id: data.novelId,
    });
    if (error) {
      console.error("[NovelNest] Error adding to reading list:", error);
      throw new Error("Could not save to reading list. Please try again.");
    }
    return { success: true };
  });

export const removeFromReadingList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ novelId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("reading_list")
      .delete()
      .eq("user_id", context.userId)
      .eq("novel_id", data.novelId);
    if (error) {
      console.error("[NovelNest] Error removing from reading list:", error);
      throw new Error("Could not remove from reading list. Please try again.");
    }
    return { success: true };
  });

