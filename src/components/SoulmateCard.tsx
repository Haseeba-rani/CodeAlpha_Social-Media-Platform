import { Link } from "@tanstack/react-router";
import { Check, Loader2, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useCountUp, useInView } from "@/hooks/use-motion";
import { supabase } from "@/integrations/supabase/client";
import { notifyFollow } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import type { SoulmateResult } from "@/lib/soulmates";

export type Soulmate = {
  id?: string;
  name: string;
  username?: string;
  avatar_url?: string | null;
  initials: string;
  match: number;
  interests: string[];
  isFollowing?: boolean;
};

export function SoulmateCard({
  soulmate,
  delay = 0,
  currentUserId = null,
  onFollowToggle,
}: {
  soulmate: Soulmate | SoulmateResult;
  delay?: number;
  currentUserId?: string | null;
  onFollowToggle?: (id: string, following: boolean) => void;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const match = useCountUp(soulmate.match, inView, 1400);

  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [following, setFollowing] = useState(Boolean(soulmate.isFollowing));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setFollowing(Boolean(soulmate.isFollowing));
  }, [soulmate.isFollowing]);

  useEffect(() => {
    if (!soulmate.avatar_url) {
      setAvatarSrc(null);
      return;
    }
    if (soulmate.avatar_url.startsWith("http")) {
      setAvatarSrc(soulmate.avatar_url);
      return;
    }
    supabase.storage
      .from("avatars")
      .createSignedUrl(soulmate.avatar_url, 3600)
      .then(({ data }) => setAvatarSrc(data?.signedUrl ?? null));
  }, [soulmate.avatar_url]);

  const canFollow = Boolean(currentUserId && soulmate.id && currentUserId !== soulmate.id);

  const toggleFollow = async () => {
    if (!canFollow || !soulmate.id || busy) return;
    setBusy(true);

    const nextFollowing = !following;
    setFollowing(nextFollowing);

    if (nextFollowing) {
      const { error } = await supabase
        .from("follows")
        .insert({ follower_id: currentUserId!, following_id: soulmate.id });

      if (error) {
        setFollowing(false);
        toast.error("Couldn't follow this reader.");
      } else {
        toast.success(`You are now following ${soulmate.name}.`);
        void notifyFollow(soulmate.id, currentUserId!);
        onFollowToggle?.(soulmate.id, true);
      }
    } else {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUserId!)
        .eq("following_id", soulmate.id);

      if (error) {
        setFollowing(true);
        toast.error("Couldn't unfollow this reader.");
      } else {
        toast.success(`Unfollowed ${soulmate.name}.`);
        onFollowToggle?.(soulmate.id, false);
      }
    }

    setBusy(false);
  };

  const handle = soulmate.username || soulmate.name.toLowerCase().replace(/\s+/g, "");

  return (
    <article
      ref={ref}
      className="group card-lift flex flex-col justify-between rounded-2xl border border-border bg-card p-5 transition-all duration-700 hover:border-gold/50 hover:shadow-glow"
      style={{
        transitionDelay: `${delay}ms`,
        opacity: inView ? 1 : 0,
        transform: inView ? "none" : "translateY(18px)",
      }}
    >
      <div>
        {/* Header with Avatar, Name & Match % */}
        <div className="flex items-center gap-3">
          {soulmate.username ? (
            <Link to="/readers/$handle" params={{ handle }} className="shrink-0">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={soulmate.name}
                  className="size-12 rounded-full object-cover ring-2 ring-gold/25 transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <span
                  role="img"
                  aria-label={soulmate.name}
                  className="inline-flex size-12 select-none items-center justify-center rounded-full bg-midnight-gradient font-display text-sm font-semibold text-primary-foreground ring-2 ring-gold/25 transition-transform duration-500 group-hover:scale-105"
                >
                  {soulmate.initials}
                </span>
              )}
            </Link>
          ) : avatarSrc ? (
            <img
              src={avatarSrc}
              alt={soulmate.name}
              className="size-12 shrink-0 rounded-full object-cover ring-2 ring-gold/25 transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <span
              role="img"
              aria-label={soulmate.name}
              className="inline-flex size-12 shrink-0 select-none items-center justify-center rounded-full bg-midnight-gradient font-display text-sm font-semibold text-primary-foreground ring-2 ring-gold/25 transition-transform duration-500 group-hover:scale-105"
            >
              {soulmate.initials}
            </span>
          )}

          <div className="min-w-0 flex-1">
            {soulmate.username ? (
              <Link
                to="/readers/$handle"
                params={{ handle }}
                className="block truncate font-display text-lg text-foreground transition-colors hover:text-wine"
              >
                {soulmate.name}
              </Link>
            ) : (
              <h3 className="truncate font-display text-lg text-foreground">{soulmate.name}</h3>
            )}
            {soulmate.username ? (
              <p className="truncate text-xs text-muted-foreground">@{soulmate.username}</p>
            ) : (
              <p className="text-xs text-muted-foreground">Reading soulmate</p>
            )}
          </div>

          <div className="text-right">
            <span className="font-display text-2xl font-bold tabular-nums text-wine">{match}%</span>
            <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
              Match
            </span>
          </div>
        </div>

        {/* Match progress bar */}
        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-secondary"
          role="progressbar"
          aria-valuenow={soulmate.match}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${soulmate.name} reading match`}
        >
          <span
            className="block h-full rounded-full bg-gold-gradient transition-[width] duration-[1400ms] ease-out motion-reduce:transition-none"
            style={{ width: `${inView ? soulmate.match : 0}%` }}
          />
        </div>

        {/* Shared interests tags */}
        {soulmate.interests.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Shared Literary Tastes:
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {soulmate.interests.map((t, i) => (
                <span
                  key={t}
                  className="inline-flex items-center rounded-full bg-secondary/80 px-2.5 py-0.5 text-xs text-secondary-foreground transition-all duration-300 hover:bg-secondary group-hover:-translate-y-0.5"
                  style={{ transitionDelay: `${i * 50}ms` }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons footer */}
      {soulmate.username && (
        <div className="mt-5 flex items-center gap-2 border-t border-border/60 pt-3.5">
          <Link
            to="/readers/$handle"
            params={{ handle }}
            className="inline-flex h-8 flex-1 items-center justify-center rounded-lg border border-border bg-secondary/40 px-3 text-xs font-medium text-foreground transition-all duration-300 hover:bg-secondary hover:text-wine active:scale-95"
          >
            View Profile
          </Link>

          {canFollow && (
            <button
              type="button"
              aria-pressed={following}
              onClick={toggleFollow}
              disabled={busy}
              className={cn(
                "inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3.5 text-xs font-medium transition-all duration-300 active:scale-95 disabled:opacity-60",
                following
                  ? "bg-gold text-gold-foreground shadow-glow"
                  : "bg-primary text-primary-foreground shadow-page hover:bg-primary/90 hover:shadow-glow"
              )}
            >
              {busy ? (
                <Loader2 className="size-3 animate-spin" />
              ) : following ? (
                <Check className="size-3 animate-pop" />
              ) : (
                <UserPlus className="size-3" />
              )}
              {following ? "Following" : "Follow"}
            </button>
          )}
        </div>
      )}
    </article>
  );
}
