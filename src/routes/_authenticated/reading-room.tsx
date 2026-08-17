import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  BookOpen,
  MessagesSquare,
  PenLine,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { NovelCard } from "@/components/NovelCard";
import { ParticleField } from "@/components/ParticleField";
import { PostCard, type PostData } from "@/components/PostCard";
import { CreatePost } from "@/components/CreatePost";
import { useAuth } from "@/lib/auth";
import { getReadingList } from "@/lib/reading-list.functions";
import { getNovels } from "@/lib/novels.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/reading-room")({
  component: ReadingRoomPage,
  head: () => ({
    meta: [
      { title: "Reading Room — NovelNest" },
      {
        name: "description",
        content:
          "Your private corner of NovelNest: your shelves, your novels and your reading world.",
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

// ─── Types ───────────────────────────────────────────────────────────────────

interface FeedPost extends PostData {
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
}

// ─── Feed Section ─────────────────────────────────────────────────────────────

function FeedSection({ currentUserId }: { currentUserId: string }) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Load posts with author profiles
      const { data: rawPosts, error: postsErr } = await supabase
        .from("posts")
        .select(
          "id, content, created_at, updated_at, user_id, profiles(id, full_name, username, avatar_url, currently_reading)",
        )
        .order("created_at", { ascending: false })
        .limit(60);

      if (postsErr) throw new Error(postsErr.message);
      if (!rawPosts || rawPosts.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      const postIds = rawPosts.map((p) => p.id);

      // 2. Batch load likes for these posts
      const { data: likesData } = await supabase
        .from("likes")
        .select("post_id, user_id")
        .in("post_id", postIds);

      // 3. Batch load comment counts
      const { data: commentsData } = await supabase
        .from("comments")
        .select("post_id")
        .in("post_id", postIds);

      // Build sets for quick lookup
      const likesByPost = new Map<string, number>();
      const likedByUser = new Set<string>();
      for (const like of likesData ?? []) {
        likesByPost.set(like.post_id, (likesByPost.get(like.post_id) ?? 0) + 1);
        if (like.user_id === currentUserId) likedByUser.add(like.post_id);
      }

      const commentsByPost = new Map<string, number>();
      for (const comment of commentsData ?? []) {
        commentsByPost.set(
          comment.post_id,
          (commentsByPost.get(comment.post_id) ?? 0) + 1,
        );
      }

      // Combine into FeedPost list
      const feedPosts: FeedPost[] = rawPosts
        .filter((p) => p.profiles) // skip posts with missing profile
        .map((p) => {
          const prof = p.profiles as {
            id: string;
            full_name: string;
            username: string;
            avatar_url: string | null;
            currently_reading: string;
          };
          return {
            id: p.id,
            content: p.content,
            created_at: p.created_at,
            user_id: p.user_id,
            author: prof,
            likeCount: likesByPost.get(p.id) ?? 0,
            commentCount: commentsByPost.get(p.id) ?? 0,
            isLiked: likedByUser.has(p.id),
          };
        });

      setPosts(feedPosts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feed.");
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  // Real-time subscription for Reading Room posts
  useEffect(() => {
    const channel = supabase
      .channel("reading-room-realtime-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        async (payload) => {
          const newPost = payload.new as {
            id: string;
            content: string;
            created_at: string;
            user_id: string;
            updated_at?: string;
          };

          // Prevent duplicate if already in state
          setPosts((prev) => {
            if (prev.some((p) => p.id === newPost.id)) return prev;
            return prev;
          });

          // Fetch author profile
          const { data: prof } = await supabase
            .from("profiles")
            .select("id, full_name, username, avatar_url, currently_reading")
            .eq("id", newPost.user_id)
            .single();

          if (prof) {
            const formatted: FeedPost = {
              id: newPost.id,
              content: newPost.content,
              created_at: newPost.created_at,
              ...(newPost.updated_at ? { updated_at: newPost.updated_at } : {}),
              user_id: newPost.user_id,
              author: prof,
              likeCount: 0,
              commentCount: 0,
              isLiked: false,
            };

            setPosts((prev) => {
              if (prev.some((p) => p.id === newPost.id)) return prev;
              return [formatted, ...prev];
            });

            if (newPost.user_id !== currentUserId) {
              toast.info(`✨ ${prof.full_name || prof.username} shared a new thought in the room.`);
            }
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "posts" },
        (payload) => {
          const updatedPost = payload.new as {
            id: string;
            content: string;
            updated_at: string;
          };
          setPosts((prev) =>
            prev.map((p) =>
              p.id === updatedPost.id
                ? { ...p, content: updatedPost.content, updated_at: updatedPost.updated_at }
                : p
            )
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "posts" },
        (payload) => {
          const deletedId = (payload.old as { id?: string })?.id;
          if (deletedId) {
            setPosts((prev) => prev.filter((p) => p.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  return (
    <div className="space-y-4">
      {/* Create post */}
      <CreatePost onCreated={loadFeed} />

      {/* Feed states */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card p-5 shadow-page"
            >
              <div className="flex gap-3">
                <div className="size-11 shrink-0 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/4 animate-pulse rounded bg-muted/70" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-3 animate-pulse rounded bg-muted" />
                <div className="h-3 w-4/5 animate-pulse rounded bg-muted/80" />
                <div className="h-3 w-3/5 animate-pulse rounded bg-muted/60" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-wine/30 bg-wine/10 p-5">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-wine" />
          <div>
            <p className="font-display text-lg text-foreground">
              The pages wouldn't load
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <button
              type="button"
              onClick={loadFeed}
              className="mt-3 inline-flex h-9 items-center rounded-xl border border-wine/40 px-4 text-xs font-medium text-wine transition-all duration-300 hover:bg-wine/10"
            >
              Try again
            </button>
          </div>
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-page">
          <PenLine className="mx-auto size-8 text-muted-foreground/50" />
          <h3 className="mt-3 font-display text-2xl text-foreground">
            The room is quiet
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Be the first to share a thought. Write about what you're reading,
            a quote that moved you, or a story worth discovering.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              initialLikeCount={post.likeCount}
              isLikedByCurrentUser={post.isLiked}
              initialCommentCount={post.commentCount}
              currentUserId={currentUserId}
              onDeleted={handlePostDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function ReadingRoomPage() {
  const { profile, profileLoading, user } = useAuth();
  const fetchNovels = useServerFn(getNovels);

  const { data: items, isLoading: listLoading } = useQuery({
    queryKey: ["reading-room-list", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("reading_list")
        .select("id, novel_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("[ReadingRoom] Error loading reading list:", error);
        throw error;
      }
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: novels } = useSuspenseQuery({
    queryKey: ["novels"],
    queryFn: () => fetchNovels({ data: undefined }),
  });

  const savedNovels =
    items?.flatMap((item) => {
      const novel = novels.find((n) => n.id === item.novel_id);
      return novel ? [novel] : [];
    }) ?? [];

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        {/* ── Welcome hero ───────────────────────────────────── */}
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
                  Welcome back,{" "}
                  {profile?.full_name?.split(" ")[0] || profile?.username || "reader"}.
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

        {/* ── Feed ───────────────────────────────────────────── */}
        <section className="mx-auto max-w-3xl px-5 py-12">
          <Reveal className="mb-6">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-wine">
              <MessagesSquare className="size-4" /> Community feed
            </p>
            <h2 className="mt-1 font-display text-3xl text-foreground sm:text-4xl">
              What readers are saying
            </h2>
          </Reveal>

          {user && <FeedSection currentUserId={user.id} />}
        </section>

        {/* ── Reading list ───────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-5 pb-16">
          <Reveal className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-wine">
              <BookOpen className="size-4" /> Your reading list
            </p>
            <h2 className="mt-2 font-display text-4xl leading-tight text-foreground sm:text-5xl">
              Novels you have saved
            </h2>
          </Reveal>

          {listLoading ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-2/3 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : savedNovels.length > 0 ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {savedNovels.map((novel, i) => (
                <Reveal key={novel.id} delay={i * 90}>
                  <NovelCard novel={novel} />
                </Reveal>
              ))}
            </div>
          ) : (
            <Reveal delay={120}>
              <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-page">
                <h3 className="font-display text-2xl text-foreground">
                  Your shelf is empty
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Browse novels and tap{" "}
                  <strong>Save to reading list</strong> to build your personal shelf.
                </p>
                <Link
                  to="/novels"
                  className="mt-5 inline-flex h-11 items-center rounded-xl bg-gold px-7 text-sm font-medium text-gold-foreground shadow-page transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow"
                >
                  Explore stories
                </Link>
              </div>
            </Reveal>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
