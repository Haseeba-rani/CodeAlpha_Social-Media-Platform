import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { NovelCard } from "@/components/NovelCard";
import { Reveal } from "@/components/Reveal";
import { novels } from "@/data/novelnest";

export const Route = createFileRoute("/novels/")({
  component: NovelsPage,
  head: () => ({
    meta: [
      { title: "Explore Stories — NovelNest" },
      {
        name: "description",
        content:
          "Browse novels the way readers actually talk about them — by conversations, ratings and the people gathered around each story.",
      },
      { property: "og:title", content: "Explore Stories — NovelNest" },
      {
        property: "og:description",
        content: "Browse novels by the conversations and readers gathered around them.",
      },
    ],
  }),
});

function NovelsPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-20">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-wine">Discover</p>
          <h1 className="mt-2 font-display text-5xl text-foreground">Explore Stories</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            Every shelf here is shaped by conversation. Pick a story and see who is reading it
            with you.
          </p>
        </Reveal>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {novels.map((n, i) => (
            <Reveal key={n.slug} delay={i * 80} variant="scale">
              <NovelCard novel={n} />
            </Reveal>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
