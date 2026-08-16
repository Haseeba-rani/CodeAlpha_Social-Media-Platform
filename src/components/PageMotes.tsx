import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type PageMotesProps = {
  /** how many paper pages rise from the book */
  count?: number;
  seed?: number;
  className?: string;
};

function pseudoRandom(n: number) {
  const x = Math.sin(n * 91.7) * 27183.1234;
  return x - Math.floor(x);
}

/**
 * Sheets of paper that lift out of the open book, curl, rotate and fade
 * into the dark. Pure CSS transforms/opacity — no JS per frame.
 */
export function PageMotes({ count = 9, seed = 3, className }: PageMotesProps) {
  const pages = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const r1 = pseudoRandom(i + seed);
        const r2 = pseudoRandom(i * 4.3 + seed);
        const r3 = pseudoRandom(i * 8.9 + seed);
        const depth = 0.55 + r3 * 0.85; // nearer pages are bigger and brighter
        return {
          left: `${(12 + r1 * 76).toFixed(2)}%`,
          width: Math.round(14 * depth),
          height: Math.round(19 * depth),
          opacity: 0.16 + depth * 0.3,
          duration: 15 + r2 * 12,
          delay: -(r1 * 22),
          sway: (r2 > 0.5 ? 1 : -1) * (18 + r3 * 46),
          spin: (r3 > 0.5 ? 1 : -1) * (25 + r1 * 55),
          blur: (1 - depth) * 1.6,
        };
      }),
    [count, seed],
  );

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden",
        className,
      )}
    >
      {pages.map((p, i) => (
        <span
          key={i}
          className="absolute bottom-[18%] block will-change-transform"
          style={
            {
              left: p.left,
              "--sway": `${p.sway}px`,
              "--spin": `${p.spin}deg`,
              animation: `page-rise ${p.duration}s cubic-bezier(0.4, 0, 0.35, 1) ${p.delay}s infinite`,
            } as React.CSSProperties
          }
        >
          <span
            className="block rounded-[2px] bg-gradient-to-br from-parchment/90 via-gold/45 to-transparent shadow-[0_2px_10px_rgba(0,0,0,0.25)]"
            style={{
              width: p.width,
              height: p.height,
              opacity: p.opacity,
              filter: `blur(${p.blur.toFixed(2)}px)`,
              animation: `page-curl ${(p.duration * 0.26).toFixed(1)}s ease-in-out ${p.delay}s infinite`,
            }}
          />
        </span>
      ))}
    </div>
  );
}
