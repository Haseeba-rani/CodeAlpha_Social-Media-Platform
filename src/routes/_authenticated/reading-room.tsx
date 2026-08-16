import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, MessagesSquare, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { NovelCard } from "@/components/NovelCard";
import { ParticleField } from "@/components/ParticleField";
import { novels } from "@/data/novelnest";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/reading-room")({
  component: ReadingRoomPage,
  head: () => ({
    meta: [
      { title: "Reading Room — NovelNest" },
      {
        name: "description",
        content: "Your private corner of NovelNest: your shelves, your novels and your reading world.",
      },
      { property: "og:title", content: "Reading Room — NovelNest" },
      {
        property: "og:description",
        content: "Your private corner of NovelNest, where your reading world lives.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function ReadingRoomPage() {
  const { profile, profileLoading } = useAuth();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden bg-midnight-gradient py-16 text-primary-foreground">
          <ParticleField count={12} seed={9} />
          <div className="relative mx-auto max-w-5xl px-5">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              <Sparkles className="size-4" /> Reading Room
            </p>
            {profileLoading && !profile ? (
              <div className="mt-3 space-y-3">
                <div className="h-10 w-72 animate-pulse rounded-lg bg-background/20" />
                <div className="h-4 w-96 max-w-full animate-pulse rounded bg-background/15" />
              </div>
            ) : (
              <>
                <h1 className="mt-2 font-display text-5xl animate-fade-up motion-reduce:animate-none">
                  Welcome back, {profile?.full_name?.split(" ")[0] || profile?.username || "reader"}.
                </h1>
                <p
                  className="mt-2 max-w-xl text-sm opacity-85 animate-fade-up motion-reduce:animate-none"
                  style={{ animationDelay: "120ms" }}
                >
                  Your reading world is waiting.{" "}
                  {profile?.currently_reading
                    ? `You're in the middle of ${profile.currently_reading}.`
                    : "Add what you're currently reading from your profile."}
                </p>
              </>
            )}
            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                to="/profile"
                className="inline-flex h-9 items-center rounded-md bg-gold px-4 text-xs font-medium text-gold-foreground shadow-page transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow"
              >
                Edit my profile
              </Link>
              <Link
                to="/novels"
                className="inline-flex h-9 items-center rounded-md border border-gold/50 px-4 text-xs font-medium transition-all duration-300 hover:border-gold hover:bg-gold/15"
              >
                Explore stories
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16">
          <Reveal className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-wine">
              <BookOpen className="size-4" /> On your shelf
            </p>
            <h2 className="mt-2 font-display text-4xl leading-tight text-foreground sm:text-5xl">
              Novels gathering readers right now
            </h2>
          </Reveal>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {novels.map((novel, i) => (
              <Reveal key={novel.slug} delay={i * 90}>
                <NovelCard novel={novel} />
              </Reveal>
            ))}
          </div>

          <Reveal delay={120}>
            <div className="mt-12 rounded-2xl border border-border bg-card p-6 shadow-page">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-wine">
                <MessagesSquare className="size-4" /> Coming soon
              </p>
              <h3 className="mt-2 font-display text-2xl text-foreground">
                Your feed is being bound
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Posts, comments, likes and reading soulmates arrive in the next chapter. For now,
                your account, profile and shelves are safely stored.
              </p>
            </div>
          </Reveal>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
