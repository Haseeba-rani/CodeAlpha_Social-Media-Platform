import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, Search, Users, X } from "lucide-react";
import { useMemo, useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ReaderCard, type ReaderProfile } from "@/components/ReaderCard";
import { Reveal } from "@/components/Reveal";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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
  const { user } = useAuth();
  const [readers, setReaders] = useState<ReaderProfile[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        // Load all profiles
        const { data: profiles, error: profilesErr } = await supabase
          .from("profiles")
          .select("id, full_name, username, bio, avatar_url, favorite_genres, currently_reading")
          .order("created_at", { ascending: true });

        if (profilesErr) throw new Error(profilesErr.message);
        if (!profiles || profiles.length === 0) {
          setReaders([]);
          setLoading(false);
          return;
        }

        const profileIds = profiles.map((p) => p.id);

        // Batch load follower counts
        const { data: followsData } = await supabase
          .from("follows")
          .select("following_id")
          .in("following_id", profileIds);

        const followerCounts = new Map<string, number>();
        for (const f of followsData ?? []) {
          followerCounts.set(f.following_id, (followerCounts.get(f.following_id) ?? 0) + 1);
        }

        // Who does the current user follow?
        if (user) {
          const { data: myFollows } = await supabase
            .from("follows")
            .select("following_id")
            .eq("follower_id", user.id);

          setFollowingIds(new Set((myFollows ?? []).map((f) => f.following_id)));
        }

        const readerList: ReaderProfile[] = profiles.map((p) => ({
          id: p.id,
          full_name: p.full_name ?? "",
          username: p.username ?? "",
          bio: p.bio ?? "",
          avatar_url: p.avatar_url ?? null,
          favorite_genres: p.favorite_genres ?? [],
          currently_reading: p.currently_reading ?? "",
          followerCount: followerCounts.get(p.id) ?? 0,
        }));

        setReaders(readerList);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load readers.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [user]);

  // Extract all unique genres across all readers
  const allGenres = useMemo(() => {
    const set = new Set<string>();
    for (const r of readers) {
      for (const g of r.favorite_genres ?? []) {
        if (g && typeof g === "string" && g.trim()) {
          set.add(g.trim());
        }
      }
    }
    return ["All", ...Array.from(set).sort()];
  }, [readers]);

  // Filter readers by search and genre
  const filteredReaders = useMemo(() => {
    const rawQ = (searchQuery ?? "").trim().toLowerCase();
    const cleanQ = rawQ.startsWith("@") ? rawQ.slice(1).trim() : rawQ;

    return readers.filter((r) => {
      // 1. Search matching
      let matchesQuery = true;
      if (rawQ) {
        const fullName = (r.full_name ?? "").toLowerCase();
        const username = (r.username ?? "").toLowerCase();
        const handleWithAt = `@${username}`;
        const bio = (r.bio ?? "").toLowerCase();
        const reading = (r.currently_reading ?? "").toLowerCase();
        const genres = (r.favorite_genres ?? []).map((g) => (g ?? "").toLowerCase());

        matchesQuery =
          fullName.includes(rawQ) ||
          fullName.includes(cleanQ) ||
          username.includes(rawQ) ||
          username.includes(cleanQ) ||
          handleWithAt.includes(rawQ) ||
          bio.includes(rawQ) ||
          bio.includes(cleanQ) ||
          reading.includes(rawQ) ||
          reading.includes(cleanQ) ||
          genres.some((g) => g.includes(rawQ) || g.includes(cleanQ));
      }

      // 2. Genre matching
      let matchesGenre = true;
      if (selectedGenre && selectedGenre !== "All") {
        const targetGenre = selectedGenre.trim().toLowerCase();
        matchesGenre = (r.favorite_genres ?? []).some(
          (g) => (g ?? "").trim().toLowerCase() === targetGenre
        );
      }

      return matchesQuery && matchesGenre;
    });
  }, [readers, searchQuery, selectedGenre]);

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

        {/* Search & Genre Filters */}
        <div className="mt-8 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search readers by name, handle, or current book…"
              className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-9 text-sm text-foreground shadow-page outline-none transition-all placeholder:text-muted-foreground focus:border-gold focus:shadow-glow"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {allGenres.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Genre:
              </span>
              {allGenres.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => setSelectedGenre(genre)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-all duration-300",
                    selectedGenre === genre
                      ? "bg-gold text-gold-foreground shadow-glow"
                      : "border border-border bg-card/60 text-muted-foreground hover:border-gold/50 hover:text-foreground"
                  )}
                >
                  {genre}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-page">
                <div className="flex gap-3">
                  <div className="size-16 animate-pulse rounded-full bg-muted" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-muted/70" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-muted/50" />
                  </div>
                </div>
                <div className="mt-3 h-8 animate-pulse rounded bg-muted/40" />
                <div className="mt-4 h-8 animate-pulse rounded-lg bg-muted/30" />
              </div>
            ))}
          </div>
        ) : error ? (
          <Reveal delay={120}>
            <div className="mt-8 flex items-start gap-3 rounded-2xl border border-wine/30 bg-wine/10 p-5">
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-wine" />
              <div>
                <p className="font-display text-lg text-foreground">
                  Couldn't open the readers' hall
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          </Reveal>
        ) : filteredReaders.length === 0 ? (
          <Reveal delay={120}>
            <div className="mt-8 rounded-2xl border border-border bg-card p-8 text-center shadow-page">
              <Users className="mx-auto size-8 text-muted-foreground/50" />
              <h2 className="mt-3 font-display text-2xl text-foreground">
                {readers.length === 0 ? "No readers yet" : "No matching readers found"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {readers.length === 0
                  ? "Be the first reader in NovelNest's community."
                  : "Try adjusting your search terms or genre filter."}
              </p>
            </div>
          </Reveal>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredReaders.map((reader, i) => (
              <Reveal key={reader.id} delay={i * 60}>
                <ReaderCard
                  reader={reader}
                  currentUserId={user?.id ?? null}
                  initiallyFollowing={followingIds.has(reader.id)}
                />
              </Reveal>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
