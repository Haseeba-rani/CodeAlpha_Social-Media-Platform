import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { BookOpen, MessagesSquare, PenLine, Sparkles, Users } from "lucide-react";
import { Hero } from "@/components/Hero";
import { NovelCard } from "@/components/NovelCard";
import { ParticleField } from "@/components/ParticleField";
import { PostCard } from "@/components/PostCard";
import { ReaderCard } from "@/components/ReaderCard";
import { Reveal } from "@/components/Reveal";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SoulmateCard } from "@/components/SoulmateCard";
import { discussion, readers, soulmates } from "@/data/novelnest";
import { getNovels } from "@/lib/novels.functions";

export const Route = createFileRoute("/")({
  component: Index,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({ queryKey: ["novels"], queryFn: () => getNovels({ data: undefined }) });
    return {};
  },
  head: () => ({
    meta: [
      { title: "NovelNest — A Social World for Novel Readers" },
      {
        name: "description",
        content:
          "Discover novels, share your thoughts and connect with readers who love the same stories. NovelNest is a warm, living home for book lovers.",
      },
      { property: "og:title", content: "NovelNest — A Social World for Novel Readers" },
      {
        property: "og:description",
        content:
          "Discover novels, share thoughts and find your reading soulmates on NovelNest.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function SectionHeading({
  eyebrow,
  title,
  copy,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  icon: typeof BookOpen;
}) {
  return (
    <Reveal className="max-w-2xl">
      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-wine">
        <Icon className="size-4" />
        {eyebrow}
      </p>
      <h2 className="mt-2 font-display text-4xl leading-tight text-foreground sm:text-5xl">
        {title}
      </h2>
      <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{copy}</p>
    </Reveal>
  );
}


function Index() {
  const { data: novels } = useSuspenseQuery({ queryKey: ["novels"], queryFn: () => getNovels({ data: undefined }) });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <Hero />

        {/* Discover */}
        <section id="discover" className="scroll-mt-20 bg-background py-24">
          <div className="mx-auto max-w-6xl px-5">
            <SectionHeading
              icon={BookOpen}
              eyebrow="Discover"
              title="Find your next favourite novel"
              copy="Shelves shaped by real conversations, not algorithms shouting at you. Hover a cover and it leans toward you like a book pulled halfway off the shelf."
            />
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {novels?.map((n, i) => (
                <Reveal key={n.slug} delay={i * 90} variant="scale">
                  <NovelCard novel={n} />
                </Reveal>
              ))}
            </div>
            <Reveal delay={200} className="mt-8">
              <Link
                to="/novels"
                className="inline-flex h-11 items-center rounded-xl border border-gold/50 px-7 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 hover:border-gold hover:bg-gold/10 hover:shadow-glow"
              >
                Browse all stories
              </Link>
            </Reveal>
          </div>
        </section>

        {/* Share */}
        <section id="share" className="relative scroll-mt-20 overflow-hidden bg-secondary/40 py-24">
          <ParticleField count={10} seed={5} className="opacity-60" />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-[1fr_1.05fr] lg:items-center">
            <SectionHeading
              icon={PenLine}
              eyebrow="Share"
              title="Say what a story did to you"
              copy="Post a thought mid-chapter, drop a review at the end, and watch the replies unfold. Likes bloom, comments slide open one after another."
            />
            <Reveal delay={140} variant="blur">
              <PostCard />
            </Reveal>
          </div>
        </section>

        {/* Connect */}
        <section id="connect" className="scroll-mt-20 bg-background py-24">
          <div className="mx-auto max-w-6xl px-5">
            <SectionHeading
              icon={Users}
              eyebrow="Connect"
              title="Readers worth following"
              copy="Follow the people whose margins you'd want to read. One tap and the button settles into place."
            />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {readers.map((r, i) => (
                <Reveal key={r.handle} delay={i * 110} variant="scale">
                  <ReaderCard reader={r} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Soulmates */}
        <section className="relative overflow-hidden bg-midnight-gradient py-24 text-primary-foreground">
          <ParticleField count={14} seed={9} />
          <div className="relative mx-auto max-w-6xl px-5">
            <Reveal className="max-w-2xl">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                <Sparkles className="size-4" />
                Reading soulmates
              </p>
              <h2 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">
                The people your bookshelf keeps pointing to
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed opacity-85">
                Match scores count up as you scroll, the way a shelf slowly reveals what you have
                in common.
              </p>
            </Reveal>
            <div className="mt-10 grid gap-4 text-foreground sm:grid-cols-2 lg:grid-cols-3">
              {soulmates.map((s, i) => (
                <SoulmateCard key={s.name} soulmate={s} delay={i * 120} />
              ))}
            </div>
          </div>
        </section>

        {/* Community */}
        <section id="community" className="scroll-mt-20 bg-background py-24">
          <div className="mx-auto max-w-3xl px-5">
            <SectionHeading
              icon={MessagesSquare}
              eyebrow="Community"
              title="Conversations that keep going"
              copy="Book clubs, late-night debates, and endings nobody agrees on."
            />
            <ul className="mt-8 space-y-4">
              {discussion.map((m, i) => (
                <Reveal as="li" key={m.name} delay={i * 180} className="flex gap-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-midnight-gradient font-display text-xs font-semibold text-primary-foreground ring-2 ring-gold/25">
                    {m.initials}
                  </span>
                  <div className="rounded-2xl rounded-tl-sm border border-border bg-secondary/60 px-4 py-3 shadow-page">
                    <p className="font-display text-base text-foreground">{m.name}</p>
                    <p className="text-sm text-foreground/85">{m.text}</p>
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden bg-secondary/50 py-24">
          <ParticleField count={12} seed={13} className="opacity-70" />
          <div className="relative mx-auto max-w-3xl px-5 text-center">
            <Reveal variant="blur">
              <h2 className="font-display text-4xl leading-tight text-foreground sm:text-5xl">
                Your next chapter has company
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                Join NovelNest and turn reading into something shared.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  to="/register"
                  className="inline-flex h-12 items-center rounded-xl bg-gold px-9 text-sm font-medium text-gold-foreground shadow-page transition-all duration-300 hover:-translate-y-1 hover:shadow-glow active:scale-[0.98]"
                >
                  Create your account
                </Link>
                <Link
                  to="/login"
                  className="inline-flex h-12 items-center rounded-xl border border-gold/50 px-9 text-sm font-medium transition-all duration-300 hover:-translate-y-1 hover:border-gold hover:bg-gold/10"
                >
                  Sign in
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
