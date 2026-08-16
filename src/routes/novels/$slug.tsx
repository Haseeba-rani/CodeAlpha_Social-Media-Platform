import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Star, Users } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { ReadingListButton } from "@/components/ReadingListButton";
import { discussion } from "@/data/novelnest";
import { getNovelBySlug } from "@/lib/novels.functions";

export const Route = createFileRoute("/novels/$slug")({
  component: NovelDetailPage,
  loader: async ({ params }) => {
    const novel = await getNovelBySlug({ data: { slug: params.slug } });
    if (!novel) throw notFound();
    return { novel };
  },
  head: ({ loaderData }) => {
    const title = loaderData?.novel.title ?? "Novel";
    return {
      meta: [
        { title: `${title} — NovelNest` },
        {
          name: "description",
          content: `Ratings, readers and conversations gathered around ${title} on NovelNest.`,
        },
        { property: "og:title", content: `${title} — NovelNest` },
        {
          property: "og:description",
          content: `See who is reading ${title} and what they are saying.`,
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
});

function NovelDetailPage() {
  const { novel } = Route.useLoaderData();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 py-16 animate-fade-up motion-reduce:animate-none">
        <div className="grid gap-8 sm:grid-cols-[220px_1fr]">
          <Reveal variant="scale">
            <img
              src={novel.cover_url}
              alt={`Cover of ${novel.title}`}
              className="w-full rounded-2xl object-cover shadow-lift"
            />
          </Reveal>
          <Reveal delay={120}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-wine">
              {novel.genres.join(" · ")}
            </p>
            <h1 className="mt-2 font-display text-5xl text-foreground">{novel.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{novel.author}</p>
            <div className="mt-4 flex items-center gap-4 text-sm">
              <span className="inline-flex items-center gap-1.5">
                <Star className="size-4 text-gold" fill="currentColor" />
                <span className="font-semibold tabular-nums">{novel.rating}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Users className="size-4" />
                {novel.readers_label} readers discussing
              </span>
            </div>
            <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">
              {novel.description}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ReadingListButton novelId={novel.id} />
              <Link
                to="/novels"
                className="inline-flex h-11 items-center rounded-xl border border-gold/50 px-7 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 hover:border-gold hover:bg-gold/10"
              >
                Back to stories
              </Link>
            </div>
          </Reveal>
        </div>

        <section className="mt-14">
          <h2 className="font-display text-3xl text-foreground">Reader conversation</h2>
          <ul className="mt-5 space-y-4">
            {discussion.map((m, i) => (
              <Reveal as="li" key={m.name} delay={i * 160} className="flex gap-3">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-midnight-gradient font-display text-xs font-semibold text-primary-foreground ring-2 ring-gold/25">
                  {m.initials}
                </span>
                <div className="rounded-2xl rounded-tl-sm border border-border bg-secondary/60 px-4 py-3">
                  <p className="font-display text-base text-foreground">{m.name}</p>
                  <p className="text-sm text-foreground/85">{m.text}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
