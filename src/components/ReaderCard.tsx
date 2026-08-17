import { Link } from "@tanstack/react-router";
import { Check, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { notifyFollow } from "@/lib/notifications";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ReaderProfile {
  id: string;
  full_name: string;
  username: string;
  bio: string;
  avatar_url: string | null;
  favorite_genres: string[];
  currently_reading: string;
  followerCount: number;
}

interface ReaderCardProps {
  reader: ReaderProfile;
  currentUserId: string | null;
  initiallyFollowing: boolean;
}

// ─── Avatar helper ────────────────────────────────────────────────────────

function ReaderAvatar({ reader }: { reader: ReaderProfile }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!reader.avatar_url) return;
    if (reader.avatar_url.startsWith("http")) {
      setSrc(reader.avatar_url);
      return;
    }
    supabase.storage
      .from("avatars")
      .createSignedUrl(reader.avatar_url, 3600)
      .then(({ data }) => setSrc(data?.signedUrl ?? null));
  }, [reader.avatar_url]);

  const initials = (reader.full_name || reader.username || "R")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={reader.full_name}
        className="size-16 shrink-0 rounded-full object-cover ring-2 ring-gold/25 transition-transform duration-500 group-hover:scale-110"
      />
    );
  }
  return (
    <span
      role="img"
      aria-label={reader.full_name}
      className="inline-flex size-16 shrink-0 select-none items-center justify-center rounded-full bg-midnight-gradient font-display text-lg font-semibold tracking-wide text-primary-foreground ring-2 ring-gold/25 transition-transform duration-500 group-hover:scale-110"
    >
      {initials}
    </span>
  );
}

// ─── ReaderCard ───────────────────────────────────────────────────────────

export function ReaderCard({ reader, currentUserId, initiallyFollowing }: ReaderCardProps) {
  const [following, setFollowing] = useState(initiallyFollowing);
  const [followerCount, setFollowerCount] = useState(reader.followerCount);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel(`reader-card-follows-${reader.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "follows",
          filter: `following_id=eq.${reader.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newFollow = payload.new as { follower_id: string };
            if (newFollow.follower_id !== currentUserId) {
              setFollowerCount((n) => n + 1);
            }
          } else if (payload.eventType === "DELETE") {
            const oldFollow = payload.old as { follower_id?: string };
            if (oldFollow?.follower_id && oldFollow.follower_id !== currentUserId) {
              setFollowerCount((n) => Math.max(0, n - 1));
            }
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [reader.id, currentUserId]);

  const canFollow = currentUserId && currentUserId !== reader.id;

  const toggleFollow = async () => {
    if (!canFollow || busy) return;
    setBusy(true);

    const nextFollowing = !following;
    // Optimistic update
    setFollowing(nextFollowing);
    setFollowerCount((n) => n + (nextFollowing ? 1 : -1));

    if (nextFollowing) {
      const { error } = await supabase
        .from("follows")
        .insert({ follower_id: currentUserId!, following_id: reader.id });
      if (error) {
        setFollowing(false);
        setFollowerCount((n) => n - 1);
        toast.error("Couldn't follow this reader.");
      } else {
        void notifyFollow(reader.id, currentUserId!);
      }
    } else {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUserId!)
        .eq("following_id", reader.id);
      if (error) {
        setFollowing(true);
        setFollowerCount((n) => n + 1);
        toast.error("Couldn't unfollow this reader.");
      }
    }

    setBusy(false);
  };

  const tags = reader.favorite_genres.slice(0, 3);

  return (
    <article className="group card-lift flex flex-col rounded-2xl border border-border bg-card p-5 transition-all duration-500 hover:border-gold/50 hover:shadow-glow">
      <div className="flex items-start gap-3">
        <ReaderAvatar reader={reader} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-xl text-foreground transition-colors duration-300 group-hover:text-wine">
            {reader.full_name || reader.username}
          </h3>
          <p className="truncate text-xs text-muted-foreground">@{reader.username}</p>
          <p className="mt-1 text-xs font-medium text-wine tabular-nums">
            {followerCount.toLocaleString()} {followerCount === 1 ? "follower" : "followers"}
          </p>
        </div>
      </div>

      {reader.bio && (
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{reader.bio}</p>
      )}

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((t, i) => (
            <span
              key={t}
              className="inline-flex items-center rounded-full border border-transparent bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground transition-all duration-300 group-hover:-translate-y-0.5"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 flex gap-2">
        <Link
          to="/readers/$handle"
          params={{ handle: reader.username }}
          className="inline-flex h-8 flex-1 cursor-pointer items-center justify-center rounded-md border border-gold/50 px-3 text-xs font-medium transition-all duration-300 hover:border-gold hover:bg-gold/15"
        >
          View Profile
        </Link>

        {canFollow ? (
          <button
            type="button"
            aria-pressed={following}
            onClick={toggleFollow}
            disabled={busy}
            className={cn(
              "inline-flex h-8 min-w-[104px] cursor-pointer items-center justify-center gap-2 rounded-md px-3 text-xs font-medium transition-all duration-300 active:scale-[0.97] disabled:opacity-70",
              following
                ? "bg-gold text-gold-foreground shadow-glow"
                : "bg-primary text-primary-foreground shadow hover:bg-primary/90 group-hover:shadow-lift",
            )}
          >
            {following ? (
              <>
                <Check className="size-4 animate-pop" /> Following
              </>
            ) : (
              <>
                <UserPlus className="size-4" /> Follow
              </>
            )}
          </button>
        ) : (
          // Placeholder for own card or logged-out
          <div className="h-8 w-[104px]" />
        )}
      </div>
    </article>
  );
}
