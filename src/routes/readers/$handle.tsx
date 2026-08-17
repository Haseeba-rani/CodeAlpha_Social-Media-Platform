import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  BookOpen,
  Check,
  Loader2,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { PostCard, type PostData } from "@/components/PostCard";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { notifyFollow } from "@/lib/notifications";

// ─── Route ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/readers/$handle")({
  component: ReaderPage,
  // ssr: false — this route needs the user's auth session (stored in localStorage)
  // to satisfy RLS on the profiles table. Running the loader server-side has no
  // session, so RLS blocks every query and the page always crashes.
  // With ssr:false the loader and component both run purely client-side.
  ssr: false,
  // Loader only passes the URL param. All real data is fetched inside the
  // component after the client has the authenticated Supabase session.
  loader: ({ params }) => ({ handle: params.handle }),
  head: ({ loaderData }) => {
    const handle = loaderData?.handle ?? "Reader";
    return {
      meta: [
        { title: `${handle} — NovelNest reader` },
        {
          name: "description",
          content: `Follow ${handle} on NovelNest and see the novels, thoughts and reviews they share.`,
        },
        { property: "og:title", content: `${handle} on NovelNest` },
        {
          property: "og:description",
          content: `See the novels and thoughts ${handle} shares with the NovelNest community.`,
        },
      ],
    };
  },
});

// ─── Types ───────────────────────────────────────────────────────────────────

interface FullProfile {
  id: string;
  full_name: string;
  username: string;
  bio: string;
  avatar_url: string | null;
  favorite_genres: string[];
  favorite_authors: string[];
  currently_reading: string;
  followerCount: number;
  followingCount: number;
}

interface FeedPost extends PostData {
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
}

// ─── Avatar ──────────────────────────────────────────────────────────────────

function BigAvatar({ profile }: { profile: FullProfile }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!profile.avatar_url) return;
    if (profile.avatar_url.startsWith("http")) {
      setSrc(profile.avatar_url);
      return;
    }
    supabase.storage
      .from("avatars")
      .createSignedUrl(profile.avatar_url, 3600)
      .then(({ data }) => setSrc(data?.signedUrl ?? null));
  }, [profile.avatar_url]);

  const initials = (profile.full_name || profile.username || "R")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={profile.full_name}
        className="size-20 rounded-full object-cover ring-2 ring-gold/25"
      />
    );
  }
  return (
    <span className="inline-flex size-20 items-center justify-center rounded-full bg-midnight-gradient font-display text-2xl font-semibold text-primary-foreground ring-2 ring-gold/25">
      {initials}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function ReaderPage() {
  const { handle } = Route.useParams();
  const { user } = useAuth();

  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = user?.id === profile?.id;
  const canFollow = user && !isOwnProfile;

  // ── Load profile + posts ─────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      setPageLoading(true);
      setError(null);

      try {
        // Profile
        const { data: prof, error: profErr } = await supabase
          .from("profiles")
          .select(
            "id, full_name, username, bio, avatar_url, favorite_genres, favorite_authors, currently_reading",
          )
          .eq("username", handle)
          .maybeSingle();

        if (profErr) throw new Error(profErr.message);
        if (!prof) throw new Error("Profile not found.");

        // Follower + following counts
        const [{ count: followerCount }, { count: followingCount }] = await Promise.all([
          supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("following_id", prof.id),
          supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("follower_id", prof.id),
        ]);

        setProfile({
          id: prof.id,
          full_name: prof.full_name ?? "",
          username: prof.username ?? "",
          bio: prof.bio ?? "",
          avatar_url: prof.avatar_url ?? null,
          favorite_genres: prof.favorite_genres ?? [],
          favorite_authors: prof.favorite_authors ?? [],
          currently_reading: prof.currently_reading ?? "",
          followerCount: followerCount ?? 0,
          followingCount: followingCount ?? 0,
        });

        // Is current user following this profile?
        if (user && user.id !== prof.id) {
          const { data: followRow } = await supabase
            .from("follows")
            .select("id")
            .eq("follower_id", user.id)
            .eq("following_id", prof.id)
            .maybeSingle();
          setFollowing(!!followRow);
        }

        // Posts by this reader
        const { data: rawPosts, error: postsErr } = await supabase
          .from("posts")
          .select("id, content, created_at, updated_at, user_id")
          .eq("user_id", prof.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (postsErr) throw new Error(postsErr.message);

        if (rawPosts && rawPosts.length > 0) {
          const postIds = rawPosts.map((p) => p.id);

          const [{ data: likesData }, { data: commentsData }] = await Promise.all([
            supabase.from("likes").select("post_id, user_id").in("post_id", postIds),
            supabase.from("comments").select("post_id").in("post_id", postIds),
          ]);

          const likesByPost = new Map<string, number>();
          const likedByUser = new Set<string>();
          for (const like of likesData ?? []) {
            likesByPost.set(like.post_id, (likesByPost.get(like.post_id) ?? 0) + 1);
            if (user && like.user_id === user.id) likedByUser.add(like.post_id);
          }

          const commentsByPost = new Map<string, number>();
          for (const c of commentsData ?? []) {
            commentsByPost.set(c.post_id, (commentsByPost.get(c.post_id) ?? 0) + 1);
          }

          const feedPosts: FeedPost[] = rawPosts.map((p) => ({
            id: p.id,
            content: p.content,
            created_at: p.created_at,
            user_id: p.user_id,
            author: {
              id: prof.id,
              full_name: prof.full_name ?? "",
              username: prof.username ?? "",
              avatar_url: prof.avatar_url ?? null,
              currently_reading: prof.currently_reading ?? "",
            },
            likeCount: likesByPost.get(p.id) ?? 0,
            commentCount: commentsByPost.get(p.id) ?? 0,
            isLiked: likedByUser.has(p.id),
          }));

          setPosts(feedPosts);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setPageLoading(false);
      }
    }

    void load();
  }, [handle, user]);

  // Real-time follower count updates on reader profile
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel(`reader-follows-realtime-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "follows",
          filter: `following_id=eq.${profile.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newFollow = payload.new as { follower_id: string; following_id: string };
            if (newFollow.follower_id !== user?.id) {
              setProfile((prev) =>
                prev ? { ...prev, followerCount: prev.followerCount + 1 } : null
              );
            }
          } else if (payload.eventType === "DELETE") {
            const oldFollow = payload.old as { follower_id?: string };
            if (oldFollow?.follower_id && oldFollow.follower_id !== user?.id) {
              setProfile((prev) =>
                prev ? { ...prev, followerCount: Math.max(0, prev.followerCount - 1) } : null
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [profile?.id, user?.id]);

  // ── Follow / Unfollow ────────────────────────────────────────────────────

  const toggleFollow = async () => {
    if (!canFollow || !profile || followBusy) return;
    setFollowBusy(true);

    const nextFollowing = !following;
    setFollowing(nextFollowing);
    setProfile((prev) =>
      prev
        ? { ...prev, followerCount: prev.followerCount + (nextFollowing ? 1 : -1) }
        : prev,
    );

    if (nextFollowing) {
      const { error } = await supabase
        .from("follows")
        .insert({ follower_id: user!.id, following_id: profile.id });
      if (error) {
        setFollowing(false);
        setProfile((prev) => prev ? { ...prev, followerCount: prev.followerCount - 1 } : prev);
        toast.error("Couldn't follow this reader.");
      } else {
        void notifyFollow(profile.id, user!.id);
      }
    } else {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user!.id)
        .eq("following_id", profile.id);
      if (error) {
        setFollowing(true);
        setProfile((prev) => prev ? { ...prev, followerCount: prev.followerCount + 1 } : prev);
        toast.error("Couldn't unfollow this reader.");
      }
    }

    setFollowBusy(false);
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  // ── Render ───────────────────────────────────────────────────────────────

  if (pageLoading) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-5 py-16">
          <div className="flex items-center gap-4">
            <div className="size-20 animate-pulse rounded-full bg-muted" />
            <div className="space-y-3">
              <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
              <div className="h-4 w-32 animate-pulse rounded bg-muted/70" />
              <div className="h-3 w-24 animate-pulse rounded bg-muted/50" />
            </div>
          </div>
          <div className="mt-8 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex gap-3">
                  <div className="size-11 animate-pulse rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-3/4 animate-pulse rounded bg-muted/70" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-5 py-16">
          <Reveal>
            <div className="flex items-start gap-3 rounded-2xl border border-wine/30 bg-wine/10 p-5">
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-wine" />
              <div>
                <p className="font-display text-lg text-foreground">
                  Reader not found
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {error ?? "This reader's profile doesn't exist."}
                </p>
                <Link
                  to="/readers"
                  className="mt-4 inline-flex h-9 items-center rounded-xl border border-gold/50 px-5 text-xs font-medium transition-all duration-300 hover:border-gold hover:bg-gold/10"
                >
                  Back to Readers
                </Link>
              </div>
            </div>
          </Reveal>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-16">
        {/* ── Profile header ─────────────────────────────────── */}
        <Reveal className="flex flex-wrap items-start gap-5">
          <BigAvatar profile={profile} />
          <div className="flex-1">
            <div className="flex flex-wrap items-start gap-3">
              <div>
                <h1 className="font-display text-4xl text-foreground">
                  {profile.full_name || profile.username}
                </h1>
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
                <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                  <span>
                    <strong className="font-medium text-wine tabular-nums">
                      {profile.followerCount.toLocaleString()}
                    </strong>{" "}
                    {profile.followerCount === 1 ? "follower" : "followers"}
                  </span>
                  <span>
                    <strong className="font-medium text-foreground/70 tabular-nums">
                      {profile.followingCount.toLocaleString()}
                    </strong>{" "}
                    following
                  </span>
                </div>
              </div>

              {canFollow && (
                <button
                  type="button"
                  aria-pressed={following}
                  onClick={toggleFollow}
                  disabled={followBusy}
                  className={cn(
                    "inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl px-5 text-xs font-medium transition-all duration-300 active:scale-[0.97] disabled:opacity-70",
                    following
                      ? "bg-gold text-gold-foreground shadow-glow"
                      : "bg-primary text-primary-foreground shadow-page hover:shadow-glow",
                  )}
                >
                  {followBusy ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : following ? (
                    <Check className="size-3.5 animate-pop" />
                  ) : (
                    <UserPlus className="size-3.5" />
                  )}
                  {following ? "Following" : "Follow"}
                </button>
              )}
            </div>
          </div>
        </Reveal>

        {/* ── Bio ─────────────────────────────────────────────── */}
        <Reveal delay={80}>
          {profile.bio && (
            <p className="mt-6 text-[15px] leading-relaxed text-muted-foreground">
              {profile.bio}
            </p>
          )}

          {profile.currently_reading && (
            <p className="mt-4 flex items-center gap-2 text-sm">
              <BookOpen className="size-4 text-wine" />
              <span className="text-muted-foreground">Currently reading:</span>
              <span className="font-medium text-foreground/90">
                {profile.currently_reading}
              </span>
            </p>
          )}

          {profile.favorite_genres.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {profile.favorite_genres.map((g) => (
                <span
                  key={g}
                  className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {profile.favorite_authors.length > 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground/70">Favourite authors: </span>
              {profile.favorite_authors.join(", ")}
            </p>
          )}
        </Reveal>

        {/* ── Posts ───────────────────────────────────────────── */}
        <Reveal delay={160} className="mt-10">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-wine">
            <Users className="size-4" /> Thoughts from {profile.full_name?.split(" ")[0] || profile.username}
          </p>
          <h2 className="mt-1 mb-5 font-display text-2xl text-foreground">
            {posts.length === 0 ? "No thoughts yet" : `${posts.length} thoughts`}
          </h2>

          {posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isOwnProfile
                  ? "Share your first thought in the Reading Room."
                  : "This reader hasn't shared any thoughts yet."}
              </p>
              {isOwnProfile && (
                <Link
                  to="/reading-room"
                  className="mt-4 inline-flex h-9 items-center rounded-xl bg-gold px-5 text-xs font-medium text-gold-foreground shadow-page transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow"
                >
                  Go to Reading Room
                </Link>
              )}
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
                  currentUserId={user?.id ?? null}
                  onDeleted={handlePostDeleted}
                />
              ))}
            </div>
          )}
        </Reveal>

        <Reveal delay={240} className="mt-10">
          <Link
            to="/readers"
            className="inline-flex h-11 items-center rounded-xl border border-gold/50 px-7 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 hover:border-gold hover:bg-gold/10"
          >
            Back to Readers
          </Link>
        </Reveal>
      </main>
      <SiteFooter />
    </div>
  );
}
