import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Search, SlidersHorizontal, Sparkles, Star, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { NovelCard } from "@/components/NovelCard";
import { Reveal } from "@/components/Reveal";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ParticleField } from "@/components/ParticleField";
import { getNovels } from "@/lib/novels.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/novels/")({
  component: NovelsPage,
  head: () => ({
    meta: [
      { title: "Browse Stories & Novels — NovelNest" },
      {
        name: "description",
        content:
          "Explore the rich collection of novels on NovelNest. Filter by genre, search by author or title, and read reader reviews.",
      },
      { property: "og:title", content: "Browse Stories & Novels — NovelNest" },
      {
        property: "og:description",
        content:
          "Discover your next favourite novel from community discussions and ratings on NovelNest.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type SortOption = "featured" | "rating" | "readers" | "title";

function NovelsPage() {
  const fetchNovels = useServerFn(getNovels);
  const { data: novels } = useSuspenseQuery({
    queryKey: ["novels"],
    queryFn: () => fetchNovels({ data: undefined }),
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [sortBy, setSortBy] = useState<SortOption>("featured");

  // Extract all unique genres from available novels
  const allGenres = useMemo(() => {
    const genresSet = new Set<string>();
    for (const novel of novels ?? []) {
      for (const g of novel.genres ?? []) {
        if (g) genresSet.add(g);
      }
    }
    return ["All", ...Array.from(genresSet).sort()];
  }, [novels]);

  // Filter and sort novels
  const filteredNovels = useMemo(() => {
    let result = (novels ?? []).filter((novel) => {
      // Search matching title or author
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        novel.title.toLowerCase().includes(query) ||
        novel.author.toLowerCase().includes(query) ||
        (novel.description && novel.description.toLowerCase().includes(query));

      // Genre matching
      const matchesGenre =
        selectedGenre === "All" ||
        (novel.genres && novel.genres.includes(selectedGenre));

      return matchesSearch && matchesGenre;
    });

    // Sorting
    switch (sortBy) {
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "readers":
        // Sort by approximate numeric value from readers_label (e.g. '1,245' -> 1245)
        result.sort((a, b) => {
          const countA = parseInt((a.readers_label || "0").replace(/\D/g, ""), 10) || 0;
          const countB = parseInt((b.readers_label || "0").replace(/\D/g, ""), 10) || 0;
          return countB - countA;
        });
        break;
      case "title":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "featured":
      default:
        // Keep initial DB order
        break;
    }

    return result;
  }, [novels, searchQuery, selectedGenre, sortBy]);

  const hasActiveFilters = searchQuery.trim() !== "" || selectedGenre !== "All" || sortBy !== "featured";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedGenre("All");
    setSortBy("featured");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        {/* ── Library Hero ───────────────────────────────────── */}
        <section className="relative overflow-hidden bg-midnight-gradient py-16 text-primary-foreground">
          <ParticleField count={14} seed={7} />
          <div className="relative mx-auto max-w-6xl px-5">
            <Reveal className="max-w-2xl">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                <BookOpen className="size-4" /> Novel Library
              </p>
              <h1 className="mt-2 font-display text-4xl leading-tight sm:text-5xl lg:text-6xl">
                The stories readers return to
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed opacity-85">
                Every title here is shaped by genuine discussion, margin notes, and community reviews.
                Search by title, author, or filter by your favorite genre.
              </p>
            </Reveal>

            {/* ── Search & Filter Bar ─────────────────────────── */}
            <div className="mt-8 grid gap-4 sm:grid-cols-[1fr_auto]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search novels by title, author, or keywords…"
                  className="h-12 w-full rounded-2xl border border-white/20 bg-background/95 pl-11 pr-10 text-sm text-foreground shadow-page outline-none backdrop-blur transition-all duration-300 placeholder:text-muted-foreground focus:border-gold focus:shadow-glow"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-2">
                <div className="relative inline-flex items-center">
                  <SlidersHorizontal className="absolute left-3.5 size-4 text-muted-foreground pointer-events-none" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="h-12 appearance-none rounded-2xl border border-white/20 bg-background/95 pl-10 pr-9 text-xs font-medium text-foreground shadow-page outline-none backdrop-blur transition-all duration-300 hover:border-gold focus:border-gold"
                  >
                    <option value="featured">Featured order</option>
                    <option value="rating">Highest Rated</option>
                    <option value="readers">Most Readers</option>
                    <option value="title">Title (A–Z)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ── Genre Filter Pills ─────────────────────────── */}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium opacity-70 mr-1">Genres:</span>
              {allGenres.map((genre) => {
                const active = selectedGenre === genre;
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => setSelectedGenre(genre)}
                    className={cn(
                      "cursor-pointer rounded-full px-3.5 py-1 text-xs font-medium transition-all duration-300 active:scale-95",
                      active
                        ? "bg-gold text-gold-foreground shadow-glow"
                        : "bg-white/10 text-primary-foreground/90 hover:bg-white/20 hover:text-white"
                    )}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Novels Grid / Results ─────────────────────────── */}
        <section className="mx-auto max-w-6xl px-5 py-16">
          {/* Header count info */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Showing{" "}
              <strong className="font-semibold text-foreground">
                {filteredNovels.length}
              </strong>{" "}
              {filteredNovels.length === 1 ? "novel" : "novels"}
              {selectedGenre !== "All" && ` in ${selectedGenre}`}
              {searchQuery && ` matching "${searchQuery}"`}
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 text-xs text-wine hover:underline"
              >
                <X className="size-3.5" />
                Reset all filters
              </button>
            )}
          </div>

          {/* Grid */}
          {filteredNovels.length > 0 ? (
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {filteredNovels.map((novel, i) => (
                <Reveal key={novel.id} delay={i * 60} variant="scale">
                  <NovelCard novel={novel} />
                </Reveal>
              ))}
            </div>
          ) : (
            /* ── Empty State ── */
            <Reveal className="mt-12">
              <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center shadow-page">
                <BookOpen className="mx-auto size-10 text-muted-foreground/40" />
                <h3 className="mt-4 font-display text-2xl text-foreground">
                  No novels found
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                  We couldn't find any stories matching your search criteria. Try a different title,
                  author name, or clear the genre filters.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex h-10 items-center rounded-xl bg-gold px-6 text-xs font-medium text-gold-foreground shadow-page transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow"
                  >
                    Clear all filters
                  </button>
                  <Link
                    to="/"
                    className="inline-flex h-10 items-center rounded-xl border border-border bg-secondary px-6 text-xs font-medium text-foreground transition-all duration-300 hover:bg-secondary/80"
                  >
                    Return Home
                  </Link>
                </div>
              </div>
            </Reveal>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
