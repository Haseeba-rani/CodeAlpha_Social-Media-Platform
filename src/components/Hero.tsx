import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import heroBook from "@/assets/hero-book.jpg";
import { PageMotes } from "@/components/PageMotes";
import { ParticleField } from "@/components/ParticleField";
import { Typewriter } from "@/components/Typewriter";
import { useIsCoarsePointer, usePrefersReducedMotion } from "@/hooks/use-motion";

export function Hero() {
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const coarse = useIsCoarsePointer();
  const reduced = usePrefersReducedMotion();
  const parallaxOn = !coarse && !reduced;

  useEffect(() => {
    if (!parallaxOn) return;
    const onMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      setPointer({ x, y });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [parallaxOn]);

  const scrollToDiscover = (e: React.MouseEvent) => {
    const el = document.getElementById("discover");
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative overflow-hidden bg-midnight-gradient text-primary-foreground">
      {/* depth layer 1 — the living book */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate3d(${-pointer.x * 26}px, ${-pointer.y * 18}px, 0)`,
          transition: "transform 1200ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <img
          src={heroBook}
          alt="An open book with glowing pages lifting into a midnight room"
          width={1536}
          height={1024}
          className="absolute inset-0 size-full scale-105 object-cover opacity-40 animate-book-float motion-reduce:animate-none"
        />
        {/* soft light sweeping across the book */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-gold/20 to-transparent motion-reduce:hidden"
          style={{ animation: "shimmer 14s ease-in-out infinite" }}
        />
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,transparent,oklch(0.16_0.04_266/0.85))]"
      />

      {/* depth layer 2 — pages escaping the book */}
      <PageMotes count={10} seed={4} />

      {/* depth layer 3 — literary dust */}
      <ParticleField
        count={20}
        seed={2}
        offsetX={pointer.x * 40}
        offsetY={pointer.y * 28}
      />

      <div className="relative mx-auto flex max-w-6xl flex-col items-start px-5 py-24 sm:py-32 lg:py-40">
        <span
          className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-background/10 px-3.5 py-1.5 text-xs tracking-wide backdrop-blur animate-fade-in motion-reduce:animate-none"
          style={{ animationDelay: "900ms" }}
        >
          <Sparkles className="size-3.5 text-gold" />A social world built for novel readers
        </span>

        <h1 className="mt-6 font-display text-6xl leading-[0.95] sm:text-7xl lg:text-8xl animate-blur-in motion-reduce:animate-none">
          NovelNest
        </h1>

        <p className="mt-4 max-w-2xl font-display text-3xl leading-snug sm:text-4xl">
          <Typewriter text="Enter a World of Stories and Connections." startDelay={620} />
        </p>


        <p
          className="mt-5 max-w-xl text-base leading-relaxed opacity-85 animate-fade-up motion-reduce:animate-none"
          style={{ animationDelay: "1250ms" }}
        >
          Discover novels, share your thoughts, and connect with readers who love the stories you
          do.
        </p>

        <div
          className="mt-9 flex flex-wrap gap-3 animate-fade-up motion-reduce:animate-none"
          style={{ animationDelay: "1400ms" }}
        >
          <Link
            to="/register"
            className="group inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-gold px-10 text-base font-medium tracking-wide text-gold-foreground shadow-page transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-glow hover:brightness-105 active:scale-[0.98]"
          >
            Join NovelNest
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <a
            href="#discover"
            onClick={scrollToDiscover}
            className="group inline-flex h-13 items-center justify-center gap-2 rounded-xl border border-gold/60 px-10 text-base font-medium tracking-wide text-primary-foreground transition-all duration-300 hover:-translate-y-1 hover:border-gold hover:bg-gold/15 hover:shadow-glow active:scale-[0.98]"
          >
            Explore Stories
            <ArrowRight className="size-4 rotate-90 transition-transform duration-300 group-hover:translate-y-1" />
          </a>
        </div>
      </div>
    </section>
  );
}
