import { Link } from "@tanstack/react-router";
import { AlertCircle, HeartHandshake, Loader2, Sparkles, UserCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { ParticleField } from "@/components/ParticleField";
import { Reveal } from "@/components/Reveal";
import { SoulmateCard } from "@/components/SoulmateCard";
import { useAuth } from "@/lib/auth";
import { loadUserSoulmates, type SoulmateResult } from "@/lib/soulmates";
import { soulmates as demoSoulmates } from "@/data/novelnest";

export function ReadingSoulmatesSection() {
  const { user, profile, loading: authLoading } = useAuth();
  const [soulmates, setSoulmates] = useState<SoulmateResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasPreferences = Boolean(
    profile &&
      ((profile.favorite_genres && profile.favorite_genres.length > 0) ||
        (profile.favorite_authors && profile.favorite_authors.length > 0) ||
        profile.currently_reading?.trim())
  );

  useEffect(() => {
    let active = true;

    async function fetchMatches() {
      if (!user || !profile) {
        setLoading(false);
        return;
      }

      if (!hasPreferences) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const matches = await loadUserSoulmates(user.id, profile);
        if (active) {
          setSoulmates(matches);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to calculate reading matches.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void fetchMatches();

    return () => {
      active = false;
    };
  }, [user, profile, hasPreferences]);

  const handleFollowToggle = (id: string, isNowFollowing: boolean) => {
    setSoulmates((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isFollowing: isNowFollowing } : s))
    );
  };

  return (
    <section className="relative overflow-hidden bg-midnight-gradient py-24 text-primary-foreground">
      <ParticleField count={14} seed={9} />
      <div className="relative mx-auto max-w-6xl px-5">
        <Reveal className="max-w-2xl">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            <Sparkles className="size-4" />
            Reading soulmates
          </p>
          <h2 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">
            {user ? "Your Reading Soulmates" : "The people your bookshelf keeps pointing to"}
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed opacity-85">
            {user
              ? "Readers whose stories and favorite margins align closely with yours."
              : "Match scores count up as you scroll, the way a shelf slowly reveals what you have in common."}
          </p>
        </Reveal>

        {/* ── State: Auth Loading ── */}
        {authLoading || (user && hasPreferences && loading) ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-card/10 p-5 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="size-12 animate-pulse rounded-full bg-white/20" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-white/20" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-white/15" />
                  </div>
                  <div className="h-7 w-12 animate-pulse rounded bg-white/20" />
                </div>
                <div className="mt-4 h-2 animate-pulse rounded-full bg-white/10" />
                <div className="mt-4 h-6 w-3/4 animate-pulse rounded bg-white/10" />
              </div>
            ))}
          </div>
        ) : error ? (
          <Reveal delay={120} className="mt-10">
            <div className="flex items-start gap-3 rounded-2xl border border-wine/40 bg-wine/20 p-6 backdrop-blur">
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-wine" />
              <div>
                <p className="font-display text-lg text-primary-foreground">
                  Couldn't load your reading matches
                </p>
                <p className="mt-1 text-sm text-primary-foreground/75">{error}</p>
              </div>
            </div>
          </Reveal>
        ) : user && !hasPreferences ? (
          /* ── State: Logged In, but Profile Incomplete ── */
          <Reveal delay={120} className="mt-10">
            <div className="rounded-3xl border border-gold/30 bg-card/20 p-8 text-center backdrop-blur-md sm:p-12">
              <HeartHandshake className="mx-auto size-12 text-gold animate-bounce" />
              <h3 className="mt-4 font-display text-2xl text-primary-foreground sm:text-3xl">
                Your story preferences are still taking shape
              </h3>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed opacity-85">
                Add your favorite genres, authors, or what you're currently reading to discover readers who share your world.
              </p>
              <div className="mt-6 flex justify-center">
                <Link
                  to="/profile"
                  className="inline-flex h-11 items-center rounded-xl bg-gold px-7 text-xs font-semibold text-gold-foreground shadow-glow transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift active:scale-95"
                >
                  Complete My Profile
                </Link>
              </div>
            </div>
          </Reveal>
        ) : user && soulmates.length === 0 ? (
          /* ── State: Logged In, Preferences Set, but No Matches Found ── */
          <Reveal delay={120} className="mt-10">
            <div className="rounded-3xl border border-white/15 bg-card/15 p-8 text-center backdrop-blur-md sm:p-12">
              <Users className="mx-auto size-10 text-gold/60" />
              <h3 className="mt-4 font-display text-2xl text-primary-foreground">
                No reading soulmates yet
              </h3>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed opacity-85">
                Keep exploring NovelNest and update your reading profile as your literary journey grows.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  to="/readers"
                  className="inline-flex h-10 items-center rounded-xl bg-gold px-6 text-xs font-semibold text-gold-foreground shadow-page transition-all duration-300 hover:shadow-glow active:scale-95"
                >
                  Discover All Readers
                </Link>
                <Link
                  to="/novels"
                  className="inline-flex h-10 items-center rounded-xl border border-white/20 bg-white/10 px-6 text-xs font-medium text-primary-foreground transition-all duration-300 hover:bg-white/20 active:scale-95"
                >
                  Explore Novels
                </Link>
              </div>
            </div>
          </Reveal>
        ) : user && soulmates.length > 0 ? (
          /* ── State: Logged In with Real Soulmate Matches ── */
          <div className="mt-10 grid gap-4 text-foreground sm:grid-cols-2 lg:grid-cols-3">
            {soulmates.map((s, i) => (
              <SoulmateCard
                key={s.id}
                soulmate={s}
                delay={i * 100}
                currentUserId={user.id}
                onFollowToggle={handleFollowToggle}
              />
            ))}
          </div>
        ) : (
          /* ── State: Guest / Logged Out ── */
          <div>
            <div className="mt-10 grid gap-4 text-foreground sm:grid-cols-2 lg:grid-cols-3">
              {demoSoulmates.map((s, i) => (
                <SoulmateCard key={s.name} soulmate={s} delay={i * 120} />
              ))}
            </div>

            <Reveal delay={200} className="mt-8 text-center">
              <p className="text-xs text-primary-foreground/75">
                Sign in to calculate your live reading compatibility and discover your real soulmates.
              </p>
              <div className="mt-3 flex justify-center gap-3">
                <Link
                  to="/login"
                  className="inline-flex h-9 items-center rounded-xl bg-gold px-5 text-xs font-semibold text-gold-foreground shadow-glow transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
                >
                  Sign in to find yours
                </Link>
              </div>
            </Reveal>
          </div>
        )}
      </div>
    </section>
  );
}
