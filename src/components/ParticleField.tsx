import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type ParticleFieldProps = {
  count?: number;
  seed?: number;
  className?: string;
  /** parallax depth offset applied by the hero */
  offsetX?: number;
  offsetY?: number;
};

function pseudoRandom(n: number) {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

export function ParticleField({
  count = 16,
  seed = 1,
  className,
  offsetX = 0,
  offsetY = 0,
}: ParticleFieldProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const r1 = pseudoRandom(i + seed);
        const r2 = pseudoRandom(i * 3.7 + seed);
        const r3 = pseudoRandom(i * 7.3 + seed);
        const isPage = i % 5 === 0;
        const near = 0.35 + r3; // depth: bigger + brighter when closer
        return {
          left: `${(r1 * 100).toFixed(2)}%`,
          top: `${(20 + r2 * 80).toFixed(2)}%`,
          size: Math.max(2, Math.round((2 + r3 * 5) * near)),
          opacity: 0.22 + near * 0.42,
          depth: 0.3 + r3 * 1.4,
          duration: 14 + r2 * 16,
          delay: -(r1 * 24),
          sway: (r2 > 0.5 ? 1 : -1) * (14 + r1 * 40),
          isPage,
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
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute block will-change-transform"
          style={{
            left: p.left,
            top: p.top,
            transform: `translate3d(${offsetX * p.depth}px, ${offsetY * p.depth}px, 0)`,
            transition: "transform 900ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <span
            className={cn(
              "block bg-gold motion-reduce:animate-none",
              p.isPage ? "rounded-[2px]" : "rounded-full",
            )}
            style={
              {
                width: p.isPage ? p.size * 2 : p.size,
                height: p.isPage ? p.size * 2.6 : p.size,
                opacity: p.opacity,
                filter: `blur(${(0.9 - p.opacity).toFixed(2)}px)`,
                "--sway": `${p.sway}px`,
                animation: `mote-rise ${p.duration}s linear ${p.delay}s infinite`,
              } as React.CSSProperties
            }
          />
        </span>
      ))}
    </div>
  );
}
