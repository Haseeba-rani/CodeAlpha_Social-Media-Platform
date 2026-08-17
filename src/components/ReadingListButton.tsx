import { Plus, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { addToReadingList, removeFromReadingList, getReadingList } from "@/lib/reading-list.functions";
import { useAuth } from "@/lib/auth";

export function ReadingListButton({ novelId }: { novelId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showLoginHint, setShowLoginHint] = useState(false);

  const fetchList = useServerFn(getReadingList);
  const addItem = useServerFn(addToReadingList);
  const removeItem = useServerFn(removeFromReadingList);

  const { data: items } = useQuery({
    queryKey: ["reading-list"],
    queryFn: () => fetchList({ data: undefined }),
    enabled: !!user,
  });

  const isSaved = items?.some((item) => item.novel_id === novelId);

  const addMutation = useMutation({
    mutationFn: () => addItem({ data: { novelId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reading-list"] });
      toast.success("Saved to your reading list!");
    },
    onError: (err) => {
      console.error("[ReadingList] Failed to add novel to reading list:", err);
      toast.error(err instanceof Error ? err.message : "Could not save to reading list. Please try again.");
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => removeItem({ data: { novelId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reading-list"] });
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

