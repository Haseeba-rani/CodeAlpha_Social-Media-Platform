import { createFileRoute, Link } from "@tanstack/react-router";
import { NovelCard } from "@/components/NovelCard";
import { Reveal } from "@/components/Reveal";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getNovels } from "@/lib/novels.functions";

export const Route = createFileRoute("/novels/")({
  component: NovelsPage,
  loader: async () => {
    const novels = await getNovels({ data: undefined });
    return { novels };
  },
  head: () => ({
    meta: [
      { title: "Browse Novels — NovelNest" },
      {
        name: "description",
        content: "Browse the novels everyone is talking about on NovelNest. Filter by mood, genre and reader count.",
      },
      { property: "og:title", content: "Browse Novels — NovelNest" },
      {
        property: "og:description",
        content: "Discover your next read from the novels readers are sharing and discussing right now.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function NovelsPage() {
  const { novels } = Route.useLoaderData();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-20">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-wine">Library</p>
          <h1 className="mt-2 font-display text-5xl leading-tight text-foreground">Browse stories</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Every novel here is one readers have saved, reviewed and talked about. Find the one you cannot put down.
          </p>
        </Reveal>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {novels.map((novel, i) => (
            <Reveal key={novel.id} delay={i * 80} variant="scale">
              <NovelCard novel={novel} />
            </Reveal>
          ))}
        </div>

        <Reveal delay={200} className="mt-12 text-center">
          <Link
            to="/"
            className="inline-flex h-11 items-center rounded-xl border border-gold/50 px-7 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 hover:border-gold hover:bg-gold/10"
          >
            Back to home
          </Link>
        </Reveal>
      </main>
      <SiteFooter />
    </div>
  );
}
