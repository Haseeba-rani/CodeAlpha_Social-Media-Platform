import { Loader2, PenLine } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface CreatePostProps {
  onCreated: () => void;
}

export function CreatePost({ onCreated }: CreatePostProps) {
  const { user, profile } = useAuth();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.avatar_url) {
      setAvatarSrc(null);
      return;
    }
    if (profile.avatar_url.startsWith("http")) {
      setAvatarSrc(profile.avatar_url);
      return;
    }
    supabase.storage
      .from("avatars")
      .createSignedUrl(profile.avatar_url, 3600)
      .then(({ data }) => setAvatarSrc(data?.signedUrl ?? null));
  }, [profile?.avatar_url]);

  const initials = (profile?.full_name || profile?.username || "R")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || !user) return;
    if (trimmed.length > 2000) {
      toast.error("Keep your thought under 2000 characters.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase
      .from("posts")
      .insert({ content: trimmed, user_id: user.id });
    setSubmitting(false);

    if (error) {
      toast.error("We couldn't publish your thought. Please try again.");
      return;
    }

    setContent("");
    toast.success("Your thought has been added to the reading room.");
    onCreated();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-card p-5 shadow-page"
    >
      <div className="flex gap-3">
        {/* Avatar */}
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt={profile?.full_name || "You"}
            className="mt-0.5 size-11 shrink-0 rounded-full object-cover ring-2 ring-gold/25"
          />
        ) : (
          <span
            aria-hidden
            className="mt-0.5 inline-flex size-11 shrink-0 select-none items-center justify-center rounded-full bg-midnight-gradient font-display text-sm font-semibold text-primary-foreground ring-2 ring-gold/25"
          >
            {initials}
          </span>
        )}

        {/* Input area */}
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Share a thought, a quote, a feeling from the pages…"
            className={cn(
              "w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-[15px] leading-relaxed text-foreground/90 outline-none transition-all duration-300",
              "placeholder:text-muted-foreground/60 focus:border-gold focus:shadow-glow",
            )}
          />

          <div className="mt-3 flex items-center justify-between">
            <span
              className={cn(
                "text-xs tabular-nums text-muted-foreground",
                content.length > 1800 && "text-wine",
              )}
            >
              {content.length}/2000
            </span>
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl bg-midnight-gradient px-5 text-xs font-medium text-primary-foreground shadow-page transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <PenLine className="size-3.5" />
              )}
              {submitting ? "Publishing…" : "Share thought"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
