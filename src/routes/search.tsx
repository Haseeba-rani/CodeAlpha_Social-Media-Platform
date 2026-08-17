import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  BookOpen,
  Compass,
  Search as SearchIcon,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { NovelCard, type Novel } from "@/components/NovelCard";
import { ReaderCard, type ReaderProfile } from "@/components/ReaderCard";
import { ParticleField } from "@/components/ParticleField";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// ─── Search Schema & Route ───────────────────────────────────────────────────

const searchSchema = z.object({
  q: z.string().optional().default(""),
  tab: z.enum(["all", "novels", "readers"]).optional().default("all"),
});

export const Route = createFileRoute("/search")({
  validateSearch: (search) => searchSchema.parse(search),
  component: SearchPage,
  head: () => ({
    meta: [
      { title: "Search Stories & Readers — NovelNest" },
      {
        name: "description",
        content:
          "Discover novels, authors, and fellow readers across NovelNest's literary community.",
      },
      { property: "og:title", content: "Search Stories & Readers — NovelNest" },
      {
        property: "og:description",
        content: "Search across novels, authors, and readers on NovelNest.",
      },
    ],
  }),
});

// ─── Popular Suggestions ─────────────────────────────────────────────────────

const POPULAR_SEARCHES = [
  { label: "Peer-e-Kamil", type: "novel", query: "Peer-e-Kamil" },
  { label: "Jannat Kay Pattay", type: "novel", query: "Jannat Kay Pattay" },
  { label: "Umera Ahmed", type: "author", query: "Umera Ahmed" },
  { label: "Nimra Ahmed", type: "author", query: "Nimra Ahmed" },
  { label: "Romance", type: "genre", query: "Romance" },
  { label: "Mystery", type: "genre", query: "Mystery" },
  { label: "Fantasy", type: "genre", query: "Fantasy" },
];

// ─── Main Search Page ────────────────────────────────────────────────────────

function SearchPage() {
  const { q: initialQ, tab: activeTab } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { user } = useAuth();

  const [inputVal, setInputVal] = useState(initialQ || "");
  const [debouncedQuery, setDebouncedQuery] = useState(initialQ || "");

  const [novels, setNovels] = useState<Novel[]>([]);
  const [readers, setReaders] = useState<ReaderProfile[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync debounced query when user stops typing (300ms debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(inputVal.trim());
      // Update URL search param
      void navigate({
        search: (prev) => ({ ...prev, q: inputVal.trim() }),
        replace: true,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [inputVal, navigate]);

  // Tab switcher helper
  const handleTabChange = (newTab: "all" | "novels" | "readers") => {
    void navigate({
      search: (prev) => ({ ...prev, tab: newTab }),
      replace: true,
    });
  };

  // ── Execute Search ─────────────────────────────────────────────────────────

  const performSearch = useCallback(
    async (query: string) => {
      if (!query) {
        setNovels([]);
        setReaders([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const trimmed = query.trim();
        const cleanQuery = trimmed.startsWith("@") ? trimmed.slice(1).trim() : trimmed;

        // 1. Search Novels (by title, author, description)
        const novelsPromise = supabase
          .from("novels")
          .select("*")
          .or(
            `title.ilike.%${cleanQuery}%,author.ilike.%${cleanQuery}%,description.ilike.%${cleanQuery}%`
          )
          .order("rating", { ascending: false });

        // 2. Search Readers (by username, full_name, bio)
        const readersPromise = supabase
          .from("profiles")
          .select("id, full_name, username, bio, avatar_url, favorite_genres, currently_reading")
          .or(
            `username.ilike.%${cleanQuery}%,full_name.ilike.%${cleanQuery}%,bio.ilike.%${cleanQuery}%`
          )
          .order("created_at", { ascending: false });

        const [novelsRes, readersRes] = await Promise.all([novelsPromise, readersPromise]);

        if (novelsRes.error) throw new Error(novelsRes.error.message);
        if (readersRes.error) throw new Error(readersRes.error.message);

        // Process novels
        const foundNovels: Novel[] = (novelsRes.data ?? []).map((n) => ({
          id: n.id,
          slug: n.slug ?? n.id,
          title: n.title,
          author: n.author,
          genres: n.genres ?? [],
          rating: n.rating,
          readers_label: n.readers_label ?? "0",
          cover_url: n.cover_url ?? "/cover-1.jpg",
          description: n.description,
        }));

        // Process readers with follower counts
        const rawProfiles = readersRes.data ?? [];
        if (rawProfiles.length > 0) {
          const profileIds = rawProfiles.map((p) => p.id);

          const [{ data: followsData }, myFollowsRes] = await Promise.all([
            supabase.from("follows").select("following_id").in("following_id", profileIds),
            user
              ? supabase.from("follows").select("following_id").eq("follower_id", user.id)
              : Promise.resolve({ data: [] }),
          ]);

          const followerCounts = new Map<string, number>();
          for (const f of followsData ?? []) {
            followerCounts.set(f.following_id, (followerCounts.get(f.following_id) ?? 0) + 1);
          }

          if (user && myFollowsRes.data) {
            setFollowingIds(new Set(myFollowsRes.data.map((f) => f.following_id)));
          }

          const foundReaders: ReaderProfile[] = rawProfiles.map((p) => ({
            id: p.id,
            full_name: p.full_name ?? "",
            username: p.username ?? "",
            bio: p.bio ?? "",
            avatar_url: p.avatar_url ?? null,
            favorite_genres: p.favorite_genres ?? [],
            currently_reading: p.currently_reading ?? "",
            followerCount: followerCounts.get(p.id) ?? 0,
          }));

          setReaders(foundReaders);
        } else {
          setReaders([]);
        }

        setNovels(foundNovels);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  useEffect(() => {
    void performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  const totalResults = novels.length + readers.length;
  const hasQuery = debouncedQuery.length > 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        {/* ── Search Hero ───────────────────────────────────── */}
        <section className="relative overflow-hidden bg-midnight-gradient py-14 text-primary-foreground sm:py-16">
          <ParticleField count={12} seed={11} />
          <div className="relative mx-auto max-w-4xl px-5">
            <Reveal className="text-center">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                <Compass className="size-4" /> Global Discovery
              </p>
              <h1 className="mt-2 font-display text-3xl sm:text-5xl lg:text-6xl">
                Explore the Nest
              </h1>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed opacity-85">
                Search across all novels, authors, and reader profiles in one unified library.
              </p>
            </Reveal>

            {/* ── Search Bar Input ── */}
            <div className="relative mx-auto mt-8 max-w-2xl">
              <SearchIcon className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Search by novel title, author, genre, or reader username…"
                autoFocus
                className="h-14 w-full rounded-2xl border border-white/20 bg-background/95 pl-12 pr-12 text-[15px] text-foreground shadow-page outline-none backdrop-blur transition-all duration-300 placeholder:text-muted-foreground focus:border-gold focus:shadow-glow"
              />
              {inputVal && (
                <button
                  type="button"
                  onClick={() => {
                    setInputVal("");
                    setDebouncedQuery("");
                  }}
                  aria-label="Clear search query"
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {/* ── Quick Starter Suggestions ── */}
            {!hasQuery && (
              <div className="mx-auto mt-5 flex max-w-2xl flex-wrap items-center justify-center gap-2 text-xs">
                <span className="font-medium opacity-70">Popular:</span>
                {POPULAR_SEARCHES.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setInputVal(item.query);
                      setDebouncedQuery(item.query);
                    }}
                    className="cursor-pointer rounded-full bg-white/10 px-3 py-1 text-primary-foreground/90 transition-all duration-200 hover:bg-white/20 hover:text-white active:scale-95"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Search Results Section ────────────────────────── */}
        <section className="mx-auto max-w-6xl px-5 py-12">
          {/* Tabs header */}
          {hasQuery && (
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleTabChange("all")}
                  className={cn(
                    "cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-300",
                    activeTab === "all"
                      ? "bg-gold text-gold-foreground shadow-glow"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  All ({totalResults})
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange("novels")}
                  className={cn(
                    "cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-300",
                    activeTab === "novels"
                      ? "bg-gold text-gold-foreground shadow-glow"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  Novels ({novels.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange("readers")}
                  className={cn(
                    "cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-300",
                    activeTab === "readers"
                      ? "bg-gold text-gold-foreground shadow-glow"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  Readers ({readers.length})
                </button>
              </div>

              <p className="text-xs text-muted-foreground">
                Showing results for <strong className="text-foreground">"{debouncedQuery}"</strong>
              </p>
            </div>
          )}

          {/* ── Loading Skeleton ── */}
          {loading ? (
            <div className="mt-8 space-y-8">
              <div>
                <div className="h-6 w-32 animate-pulse rounded-lg bg-muted" />
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="aspect-2/3 animate-pulse rounded-2xl bg-muted" />
                  ))}
                </div>
              </div>
            </div>
          ) : error ? (
            /* ── Error State ── */
            <div className="mt-8 flex items-start gap-3 rounded-2xl border border-wine/30 bg-wine/10 p-5">
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-wine" />
              <div>
                <p className="font-display text-lg text-foreground">Search Error</p>
                <p className="mt-1 text-sm text-muted-foreground">{error}</p>
                <button
                  type="button"
                  onClick={() => performSearch(debouncedQuery)}
                  className="mt-3 inline-flex h-8 items-center rounded-lg border border-wine/40 px-3 text-xs font-medium text-wine hover:bg-wine/10"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : !hasQuery ? (
            /* ── Initial Empty Starter State ── */
            <Reveal className="py-12 text-center">
              <Compass className="mx-auto size-12 text-gold/60" />
              <h2 className="mt-4 font-display text-2xl text-foreground sm:text-3xl">
                Ready to find a novel or meet a reader?
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Type above to discover titles from classic dramas to thrilling mysteries, or search
                for book lovers by name or handle.
              </p>
            </Reveal>
          ) : totalResults === 0 ? (
            /* ── No Results Found ── */
            <Reveal className="py-12">
              <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center shadow-page">
                <SearchIcon className="mx-auto size-10 text-muted-foreground/40" />
                <h3 className="mt-4 font-display text-2xl text-foreground">
                  No matches for "{debouncedQuery}"
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                  We couldn't find any novels or readers matching that term. Check the spelling or
                  try exploring general terms like authors or genres.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setInputVal("");
                      setDebouncedQuery("");
                    }}
                    className="inline-flex h-10 items-center rounded-xl bg-gold px-6 text-xs font-medium text-gold-foreground shadow-page transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow"
                  >
                    Clear search
                  </button>
                  <Link
                    to="/novels"
                    className="inline-flex h-10 items-center rounded-xl border border-border bg-secondary px-6 text-xs font-medium text-foreground transition-all duration-300 hover:bg-secondary/80"
                  >
                    Browse all novels
                  </Link>
                </div>
              </div>
            </Reveal>
          ) : (
            /* ── Active Results View ── */
            <div className="mt-8 space-y-12">
              {/* 1. Novels Subsection */}
              {(activeTab === "all" || activeTab === "novels") && (
                <div>
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className="inline-flex items-center gap-2 font-display text-2xl text-foreground">
                      <BookOpen className="size-5 text-wine" />
                      Novels ({novels.length})
                    </h2>
                    {activeTab === "all" && novels.length > 4 && (
                      <button
                        type="button"
                        onClick={() => handleTabChange("novels")}
                        className="text-xs font-medium text-wine hover:underline"
                      >
                        View all {novels.length} novels →
                      </button>
                    )}
                  </div>

                  {novels.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                      {(activeTab === "all" ? novels.slice(0, 4) : novels).map((novel, i) => (
                        <Reveal key={novel.id} delay={i * 60} variant="scale">
                          <NovelCard novel={novel} />
                        </Reveal>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">
                      No novels matched this search query.
                    </p>
                  )}
                </div>
              )}

              {/* 2. Readers Subsection */}
              {(activeTab === "all" || activeTab === "readers") && (
                <div>
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className="inline-flex items-center gap-2 font-display text-2xl text-foreground">
                      <Users className="size-5 text-wine" />
                      Readers ({readers.length})
                    </h2>
                    {activeTab === "all" && readers.length > 3 && (
                      <button
                        type="button"
                        onClick={() => handleTabChange("readers")}
                        className="text-xs font-medium text-wine hover:underline"
                      >
                        View all {readers.length} readers →
                      </button>
                    )}
                  </div>

                  {readers.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {(activeTab === "all" ? readers.slice(0, 3) : readers).map((reader, i) => (
                        <Reveal key={reader.id} delay={i * 60}>
                          <ReaderCard
                            reader={reader}
                            currentUserId={user?.id ?? null}
                            initiallyFollowing={followingIds.has(reader.id)}
                          />
                        </Reveal>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">
                      No readers matched this search query.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
