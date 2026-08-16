import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ReaderCard } from "@/components/ReaderCard";
import { Reveal } from "@/components/Reveal";
import { readers } from "@/data/novelnest";

export const Route = createFileRoute("/readers/")({
  component: ReadersPage,
  head: () => ({
    meta: [
      { title: "Readers — NovelNest" },
      {
        name: "description",
        content:
          "Meet the readers of NovelNest: the annotators, the late-night finishers and the people who love the stories you love.",
      },
      { property: "og:title", content: "Readers — NovelNest" },
      {
        property: "og:description",
        content: "Meet the readers who love the same stories you do.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function ReadersPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-16">
        <Reveal className="max-w-2xl">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-wine">
            <Users className="size-4" /> Readers
          </p>
          <h1 className="mt-2 font-display text-4xl leading-tight text-foreground sm:text-5xl">
            The people behind the pages
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Every shelf tells a story of its own. Follow the readers whose taste feels like yours.
          </p>
        </Reveal>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {readers.map((reader, i) => (
            <Reveal key={reader.handle} delay={i * 90}>
              <ReaderCard reader={reader} />
            </Reveal>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
