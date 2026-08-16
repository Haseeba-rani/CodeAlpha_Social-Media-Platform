import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { PostCard } from "@/components/PostCard";
import { readers } from "@/data/novelnest";

export const Route = createFileRoute("/readers/$handle")({
  component: ReaderPage,
  loader: ({ params }) => {
    const reader = readers.find((r) => r.handle === params.handle);
    if (!reader) throw notFound();
    return { reader };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.reader.name ?? "Reader";
    return {
      meta: [
        { title: `${name} — NovelNest reader` },
        {
          name: "description",
          content: `Follow ${name} on NovelNest and see the novels, thoughts and reviews they share.`,
        },
        { property: "og:title", content: `${name} on NovelNest` },
        {
          property: "og:description",
          content: `See the novels and thoughts ${name} shares with the NovelNest community.`,
        },
      ],
    };
  },
});

function ReaderPage() {
  const { reader } = Route.useLoaderData();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <Reveal className="flex items-center gap-4">
          <span className="inline-flex size-20 items-center justify-center rounded-full bg-midnight-gradient font-display text-2xl font-semibold text-primary-foreground ring-2 ring-gold/25">
            {reader.initials}
          </span>
          <div>
            <h1 className="font-display text-4xl text-foreground">{reader.name}</h1>
            <p className="text-sm text-muted-foreground">@{reader.handle}</p>
            <p className="mt-1 text-xs font-medium text-wine tabular-nums">
              {reader.followers.toLocaleString()} followers
            </p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <p className="mt-6 text-[15px] leading-relaxed text-muted-foreground">{reader.bio}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {reader.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        </Reveal>

        <Reveal delay={200} className="mt-10">
          <h2 className="mb-4 font-display text-2xl text-foreground">Latest thought</h2>
          <PostCard />
        </Reveal>

        <Reveal delay={280} className="mt-10">
          <Link
            to="/"
            className="inline-flex h-11 items-center rounded-xl border border-gold/50 px-7 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 hover:border-gold hover:bg-gold/10"
          >
            Back to NovelNest
          </Link>
        </Reveal>
      </main>
      <SiteFooter />
    </div>
  );
}
