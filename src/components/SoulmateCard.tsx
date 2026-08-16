import { useCountUp, useInView } from "@/hooks/use-motion";

type Soulmate = {
  name: string;
  initials: string;
  match: number;
  interests: string[];
};

export function SoulmateCard({ soulmate, delay = 0 }: { soulmate: Soulmate; delay?: number }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const match = useCountUp(soulmate.match, inView, 1400);

  return (
    <div
      ref={ref}
      className="group card-lift rounded-2xl border border-border bg-card p-5 transition-all duration-700 hover:border-gold/50 hover:shadow-glow"
      style={{
        transitionDelay: `${delay}ms`,
        opacity: inView ? 1 : 0,
        transform: inView ? "none" : "translateY(18px)",
      }}
    >
      <div className="flex items-center gap-3">
        <span
          role="img"
          aria-label={soulmate.name}
          className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-midnight-gradient font-display text-sm font-semibold text-primary-foreground ring-2 ring-gold/25 transition-transform duration-500 group-hover:scale-110"
        >
          {soulmate.initials}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-lg text-foreground">{soulmate.name}</h3>
          <p className="text-xs text-muted-foreground">Reading soulmate</p>
        </div>
        <span className="font-display text-2xl tabular-nums text-wine">{match}%</span>
      </div>

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

      <div className="mt-4 flex flex-wrap gap-1.5">
        {soulmate.interests.map((t, i) => (
          <span
            key={t}
            className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground transition-transform duration-300 group-hover:-translate-y-0.5"
            style={{ transitionDelay: `${i * 60}ms` }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
