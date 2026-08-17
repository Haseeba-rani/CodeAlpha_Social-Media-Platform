/**
 * DemoReaderCard — used on the landing page to showcase the reader card UI
 * with static mock data. The real ReaderCard (ReaderCard.tsx) is used in the
 * authenticated readers pages with live Supabase data.
 */
import { Link } from "@tanstack/react-router";
import { Check, UserPlus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Reader } from "@/data/novelnest";

export function DemoReaderCard({ reader }: { reader: Reader }) {
  const [following, setFollowing] = useState(false);
  const followers = reader.followers + (following ? 1 : 0);

  return (
    <article className="group card-lift flex flex-col rounded-2xl border border-border bg-card p-5 transition-all duration-500 hover:border-gold/50 hover:shadow-glow">
      <div className="flex items-start gap-3">
        <span
          role="img"
          aria-label={reader.name}
          className="inline-flex size-16 shrink-0 select-none items-center justify-center rounded-full bg-midnight-gradient font-display text-lg font-semibold tracking-wide text-primary-foreground ring-2 ring-gold/25 transition-transform duration-500 group-hover:scale-110"
        >
          {reader.initials}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-xl text-foreground transition-colors duration-300 group-hover:text-wine">
            {reader.name}
          </h3>
          <p className="truncate text-xs text-muted-foreground">@{reader.handle}</p>
          <p className="mt-1 text-xs font-medium text-wine tabular-nums">
            {followers.toLocaleString()} followers
          </p>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{reader.bio}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {reader.tags.map((t, i) => (
          <span
            key={t}
            className="inline-flex items-center rounded-full border border-transparent bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground transition-all duration-300 group-hover:-translate-y-0.5"
            style={{ transitionDelay: `${i * 60}ms` }}
          >
            {t}
          </span>
        ))}
      </div>

      <div className="mt-5 flex gap-2">
        <Link
          to="/readers/$handle"
          params={{ handle: reader.handle }}
          className="inline-flex h-8 flex-1 items-center justify-center rounded-md border border-gold/50 px-3 text-xs font-medium transition-all duration-300 hover:border-gold hover:bg-gold/15"
        >
          View Profile
        </Link>
        <button
          type="button"
          aria-pressed={following}
          onClick={() => setFollowing((f) => !f)}
          className={cn(
            "inline-flex h-8 min-w-[104px] cursor-pointer items-center justify-center gap-2 rounded-md px-3 text-xs font-medium transition-all duration-300 active:scale-[0.97]",
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
      </div>
    </article>
  );
}
