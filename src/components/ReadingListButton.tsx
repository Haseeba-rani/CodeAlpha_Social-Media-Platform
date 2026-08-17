import { Plus, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function ReadingListButton({ novelId }: { novelId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showLoginHint, setShowLoginHint] = useState(false);

  const { data: items } = useQuery({
    queryKey: ["reading-list", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("reading_list")
        .select("id, novel_id, created_at")
        .eq("user_id", user.id);
      if (error) {
        console.error("[ReadingList] Query error:", error);
        throw error;
      }
      return data ?? [];
    },
    enabled: !!user,
  });

  const isSaved = items?.some((item) => item.novel_id === novelId);

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Please sign in to save novels.");
      const { data, error } = await supabase
        .from("reading_list")
        .insert({
          user_id: user.id,
          novel_id: novelId,
        })
        .select()
        .single();

      if (error) {
        console.error("[ReadingList] Add error:", error);
        if (error.code === "23505") {
          // Already saved, treat as success
          return { alreadySaved: true };
        }
        throw new Error(error.message || "Could not save to reading list. Please try again.");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reading-list"] });
      queryClient.invalidateQueries({ queryKey: ["reading-room-list"] });
      toast.success("Saved to your reading list!");
    },
    onError: (err) => {
      console.error("[ReadingList] Failed to add novel to reading list:", err);
      toast.error(err instanceof Error ? err.message : "Could not save to reading list. Please try again.");
    },
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Please sign in.");
      const { error } = await supabase
        .from("reading_list")
        .delete()
        .eq("user_id", user.id)
        .eq("novel_id", novelId);

      if (error) {
        console.error("[ReadingList] Remove error:", error);
        throw new Error(error.message || "Could not remove from reading list. Please try again.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reading-list"] });
      queryClient.invalidateQueries({ queryKey: ["reading-room-list"] });
      toast.success("Removed from your reading list.");
    },
    onError: (err) => {
      console.error("[ReadingList] Failed to remove novel from reading list:", err);
      toast.error(err instanceof Error ? err.message : "Could not remove from reading list. Please try again.");
    },
  });

  const handleClick = () => {
    if (!user) {
      setShowLoginHint(true);
      setTimeout(() => setShowLoginHint(false), 2500);
      return;
    }
    if (isSaved) {
      removeMutation.mutate();
    } else {
      addMutation.mutate();
    }
  };

  const busy = addMutation.isPending || removeMutation.isPending;

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleClick}
        disabled={busy}
        className={`inline-flex h-11 items-center gap-2 rounded-xl px-7 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60 ${
          isSaved
            ? "bg-secondary text-foreground border border-border hover:bg-secondary/80"
            : "bg-gold text-gold-foreground shadow-page hover:shadow-glow"
        }`}
      >
        {busy ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Saving...
          </>
        ) : isSaved ? (
          <>
            <Check className="size-4" /> Saved
          </>
        ) : (
          <>
            <Plus className="size-4" /> Save to reading list
          </>
        )}
      </button>
      {showLoginHint && (
        <span className="text-xs text-muted-foreground">Sign in to save novels to your reading list.</span>
      )}
    </div>
  );
}
