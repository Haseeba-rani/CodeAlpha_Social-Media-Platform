import { Link } from "@tanstack/react-router";
import { Star, Users } from "lucide-react";
import { useRef, useState } from "react";
import { useIsCoarsePointer, usePrefersReducedMotion } from "@/hooks/use-motion";

export type Novel = {
  id: string;
  slug: string;
  title: string;
  author: string;
  genres: string[];
  rating: number;
  readers_label: string;
  cover_url: string;
  description: string;
};

export function NovelCard({ novel }: { novel: Novel }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const coarse = useIsCoarsePointer();
  const reduced = usePrefersReducedMotion();
  const still = coarse || reduced;

  const onMove = (e: React.MouseEvent) => {
    if (still || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ x: -py * 6, y: px * 8 });
  };

  const genreLabel = novel.genres[0] ?? "Novel";

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      style={{ perspective: "900px" }}
    >
      <Link
        to="/novels/$slug"
        params={{ slug: novel.slug }}
        className="group card-lift block rounded-2xl border border-border bg-card p-3 transition-all duration-500 hover:border-gold/60 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        <div className="sheen relative overflow-hidden rounded-xl bg-muted">
          <img
            src={novel.cover_url}
            alt={`Cover of ${novel.title} by ${novel.author}`}
            loading="lazy"
            width={640}
            height={960}
            className="aspect-2/3 w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]"
          />
          <div className="pointer-events-none absolute inset-0 bg-midnight-gradient opacity-0 transition-opacity duration-500 group-hover:opacity-25" />
          <span className="absolute left-2 top-2 rounded-full bg-background/85 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-wine backdrop-blur transition-transform duration-500 group-hover:-translate-y-0.5">
            {genreLabel}
          </span>
        </div>
        <div className="px-1 pb-1 pt-3">
          <h3 className="font-display text-lg leading-snug text-foreground transition-colors duration-300 group-hover:text-wine">
            {novel.title}
          </h3>
          <p className="text-xs text-muted-foreground">{novel.author}</p>
          <div className="mt-2.5 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-1.5"
              aria-label={`Rated ${novel.rating} out of 5`}
            >
              <span className="flex items-center gap-0.5" aria-hidden="true">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className="size-3 text-gold transition-transform duration-300 group-hover:scale-110"
                    style={{ transitionDelay: `${i * 40}ms` }}
                    fill={i < Math.round(novel.rating) ? "currentColor" : "none"}
                  />
                ))}
              </span>
              <span className="text-xs font-semibold tabular-nums text-foreground/80">
                {novel.rating}
              </span>
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="size-3" />
              {novel.readers_label}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
