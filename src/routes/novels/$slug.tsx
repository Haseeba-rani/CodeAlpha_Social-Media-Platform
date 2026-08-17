import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  AlertCircle,
  BookOpen,
  Check,
  Edit3,
  Loader2,
  MessageSquare,
  PenLine,
  Send,
  Star,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { ReadingListButton } from "@/components/ReadingListButton";
import { ParticleField } from "@/components/ParticleField";
import { getNovelBySlug } from "@/lib/novels.functions";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// ─── Route ───────────────────────────────────────────────────────────────────

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
          content: `Ratings, readers and reviews gathered around ${title} on NovelNest.`,
        },
        { property: "og:title", content: `${title} — NovelNest` },
        {
          property: "og:description",
          content: `See who is reading ${title} and what they are saying in reviews.`,
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
});

// ─── Types ───────────────────────────────────────────────────────────────────

interface ReviewProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface NovelReview {
  id: string;
  novel_id: string;
  user_id: string;
  rating: number;
  content: string;
  created_at: string;
  updated_at: string;
  profiles: ReviewProfile | null;
}

// ─── Star Rating Display ──────────────────────────────────────────────────────

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const iconSize = size === "lg" ? "size-5" : size === "md" ? "size-4" : "size-3.5";
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Rated ${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i < Math.round(rating);
        return (
          <Star
            key={i}
            className={cn(iconSize, filled ? "text-gold fill-current" : "text-muted-foreground/30")}
          />
        );
      })}
    </span>
  );
}

// ─── Interactive Star Rating Input ───────────────────────────────────────────

function StarRatingInput({
  value,
  onChange,
  disabled = false,
}: {
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const activeValue = hovered !== null ? hovered : value;

  return (
    <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Select a rating">
      {Array.from({ length: 5 }, (_, i) => {
        const starNumber = i + 1;
        const isFilled = starNumber <= activeValue;
        return (
          <button
            key={starNumber}
            type="button"
            role="radio"
            aria-checked={value === starNumber}
            aria-label={`${starNumber} star${starNumber > 1 ? "s" : ""}`}
            disabled={disabled}
            onMouseEnter={() => !disabled && setHovered(starNumber)}
            onMouseLeave={() => !disabled && setHovered(null)}
            onClick={() => !disabled && onChange(starNumber)}
            className="group cursor-pointer p-1 transition-transform duration-200 hover:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:cursor-not-allowed"
          >
            <Star
              className={cn(
                "size-6 transition-colors duration-200",
                isFilled
                  ? "text-gold fill-current drop-shadow-[0_0_8px_rgba(224,170,62,0.4)]"
                  : "text-muted-foreground/40 hover:text-gold/60"
              )}
            />
          </button>
        );
      })}
      <span className="ml-2 text-xs font-semibold text-foreground/80 tabular-nums">
        {activeValue > 0 ? `${activeValue} / 5 stars` : "Select rating"}
      </span>
    </div>
  );
}

// ─── Reviewer Avatar ─────────────────────────────────────────────────────────

function ReviewerAvatar({ profile }: { profile: ReviewProfile | null }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.avatar_url) return;
    if (profile.avatar_url.startsWith("http")) {
      setSrc(profile.avatar_url);
      return;
    }
    supabase.storage
      .from("avatars")
      .createSignedUrl(profile.avatar_url, 3600)
      .then(({ data }) => setSrc(data?.signedUrl ?? null));
  }, [profile?.avatar_url]);

  const initials = (profile?.full_name || profile?.username || "R")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={profile?.full_name || "Reader avatar"}
        className="size-10 shrink-0 rounded-full object-cover ring-2 ring-gold/25"
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={profile?.full_name || "Reader"}
      className="inline-flex size-10 shrink-0 select-none items-center justify-center rounded-full bg-midnight-gradient font-display text-xs font-semibold tracking-wide text-primary-foreground ring-2 ring-gold/25"
    >
      {initials}
    </span>
  );
}

// ─── Main Novel Detail Page ──────────────────────────────────────────────────

function NovelDetailPage() {
  const { novel } = Route.useLoaderData();
  const { user } = useAuth();

  // Reviews state
  const [reviews, setReviews] = useState<NovelReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  // New / Edit Review form state
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Check if current user already reviewed
  const userExistingReview = useMemo(() => {
    if (!user) return null;
    return reviews.find((r) => r.user_id === user.id) ?? null;
  }, [reviews, user]);

  // Load reviews for this novel
  const loadReviews = useCallback(async () => {
    setLoadingReviews(true);
    setReviewsError(null);

    try {
      const { data, error } = await supabase
        .from("reviews")
        .select(
          "id, novel_id, user_id, rating, content, created_at, updated_at, profiles(id, full_name, username, avatar_url)"
        )
        .eq("novel_id", novel.id)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      setReviews((data as unknown as NovelReview[]) ?? []);
    } catch (err) {
      setReviewsError(err instanceof Error ? err.message : "Failed to load reader reviews.");
    } finally {
      setLoadingReviews(false);
    }
  }, [novel.id]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  // Calculate dynamic average rating
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return novel.rating;
    const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
    return Number((sum / reviews.length).toFixed(1));
  }, [reviews, novel.rating]);

  // Start editing own review
  const handleStartEdit = (rev: NovelReview) => {
    setEditingReviewId(rev.id);
    setRating(rev.rating);
    setContent(rev.content);
    setIsFormOpen(true);
    // Smooth scroll to form
    const el = document.getElementById("review-form-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setRating(5);
    setContent("");
    setIsFormOpen(false);
  };

  // Submit new review or update existing review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || !user) return;

    if (rating < 1 || rating > 5) {
      toast.error("Please select a rating between 1 and 5 stars.");
      return;
    }

    setSubmitting(true);

    if (editingReviewId) {
      // Update existing review
      const { error } = await supabase
        .from("reviews")
        .update({
          rating,
          content: trimmed,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingReviewId)
        .eq("user_id", user.id);

      setSubmitting(false);

      if (error) {
        toast.error("Couldn't update your review. Please try again.");
        return;
      }

      toast.success("Your review has been updated!");
      handleCancelEdit();
      await loadReviews();
    } else {
      // Insert new review
      const { error } = await supabase.from("reviews").insert({
        novel_id: novel.id,
        user_id: user.id,
        rating,
        content: trimmed,
      });

      setSubmitting(false);

      if (error) {
        if (error.code === "23505") {
          toast.error("You have already reviewed this novel. You can edit your existing review.");
        } else {
          toast.error("Couldn't post your review. Please try again.");
        }
        return;
      }

      toast.success("Thank you! Your review has been added.");
      setContent("");
      setRating(5);
      setIsFormOpen(false);
      await loadReviews();
    }
  };

  // Delete own review
  const handleDeleteReview = async (reviewId: string) => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to delete your review?")) return;

    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId)
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to delete review.");
      return;
    }

    toast.success("Your review has been removed.");
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    if (editingReviewId === reviewId) handleCancelEdit();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 py-16">
        {/* ── Novel Overview ─────────────────────────────────── */}
        <div className="grid gap-10 md:grid-cols-[280px_1fr]">
          {/* Cover with 3D shadow & genre pill */}
          <Reveal variant="scale" className="relative">
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-3 shadow-lift">
              <img
                src={novel.cover_url}
                alt={`Cover of ${novel.title}`}
                className="aspect-2/3 w-full rounded-2xl object-cover shadow-page"
              />
              <span className="absolute left-6 top-6 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-wine shadow backdrop-blur">
                {novel.genres[0] || "Novel"}
              </span>
            </div>
          </Reveal>

          {/* Details & Actions */}
          <Reveal delay={120} className="flex flex-col justify-between">
            <div>
              {/* Genres list */}
              <div className="flex flex-wrap gap-1.5">
                {novel.genres.map((g) => (
                  <span
                    key={g}
                    className="inline-flex items-center rounded-full bg-secondary px-3 py-0.5 text-xs font-medium text-secondary-foreground"
                  >
                    {g}
                  </span>
                ))}
              </div>

              <h1 className="mt-3 font-display text-4xl leading-tight text-foreground sm:text-5xl">
                {novel.title}
              </h1>
              <p className="mt-1 font-serif text-lg text-muted-foreground">
                by <span className="font-semibold text-foreground/90">{novel.author}</span>
              </p>

              {/* Rating & Reader stats */}
              <div className="mt-5 flex flex-wrap items-center gap-6 rounded-2xl border border-border bg-card/60 p-4 shadow-page">
                <div className="flex items-center gap-2.5">
                  <StarRating rating={averageRating} size="md" />
                  <span className="font-display text-xl font-bold tabular-nums text-foreground">
                    {averageRating}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
                  </span>
                </div>

                <div className="hidden h-6 w-px bg-border sm:block" />

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="size-4 text-wine" />
                  <span>
                    <strong className="font-medium text-foreground">{novel.readers_label}</strong>{" "}
                    readers discussing
                  </span>
                </div>
              </div>

              {/* Synopsis */}
              <div className="mt-6">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-wine">
                  Synopsis
                </h2>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                  {novel.description}
                </p>
              </div>
            </div>

            {/* Actions: Reading List & Navigation */}
            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-6">
              <ReadingListButton novelId={novel.id} />

              {user && !userExistingReview && !isFormOpen && (
                <button
                  type="button"
                  onClick={() => setIsFormOpen(true)}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-gold/50 px-6 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 hover:border-gold hover:bg-gold/15"
                >
                  <PenLine className="size-4 text-gold" />
                  Write a review
                </button>
              )}

              <Link
                to="/novels"
                className="inline-flex h-11 items-center rounded-xl border border-border bg-secondary/70 px-6 text-sm font-medium transition-all duration-300 hover:bg-secondary"
              >
                Back to library
              </Link>
            </div>
          </Reveal>
        </div>

        {/* ── Reviews Section ────────────────────────────────── */}
        <section id="review-form-section" className="mt-20 border-t border-border pt-12">
          <Reveal className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-wine">
                <MessageSquare className="size-4" /> Reader Reviews & Thoughts
              </p>
              <h2 className="mt-1 font-display text-3xl text-foreground sm:text-4xl">
                What Readers Are Saying
              </h2>
            </div>

            {user && !userExistingReview && !isFormOpen && (
              <button
                type="button"
                onClick={() => setIsFormOpen(true)}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-gold px-5 text-xs font-medium text-gold-foreground shadow-page transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow"
              >
                <PenLine className="size-3.5" />
                Write a review
              </button>
            )}
          </Reveal>

          {/* ── Review Form (Write / Edit) ── */}
          {user ? (
            (isFormOpen || editingReviewId) && (
              <Reveal delay={60} className="mt-8">
                <form
                  onSubmit={handleSubmitReview}
                  className="rounded-3xl border border-gold/40 bg-card p-6 shadow-glow"
                >
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <h3 className="font-display text-xl text-foreground">
                      {editingReviewId ? "Edit your review" : `Reviewing "${novel.title}"`}
                    </h3>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="mt-5 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Your Rating
                      </label>
                      <div className="mt-2">
                        <StarRatingInput value={rating} onChange={setRating} disabled={submitting} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Your Thoughts & Critique
                      </label>
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={4}
                        maxLength={1500}
                        placeholder="What moved you? How did the characters develop? Share your honest reaction…"
                        required
                        className="mt-2 w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-relaxed text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground/60 focus:border-gold focus:shadow-glow"
                      />
                      <div className="mt-1 flex justify-end text-xs tabular-nums text-muted-foreground">
                        {content.length}/1500
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={submitting}
                        className="inline-flex h-10 items-center rounded-xl border border-border px-5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting || !content.trim()}
                        className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-gold px-6 text-xs font-medium text-gold-foreground shadow-page transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {submitting ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Send className="size-3.5" />
                        )}
                        {submitting ? "Saving…" : editingReviewId ? "Update Review" : "Publish Review"}
                      </button>
                    </div>
                  </div>
                </form>
              </Reveal>
            )
          ) : (
            /* ── Sign-in Prompt for Guest Readers ── */
            <Reveal delay={80} className="mt-8">
              <div className="rounded-2xl border border-dashed border-border bg-secondary/40 p-6 text-center">
                <BookOpen className="mx-auto size-7 text-wine/70" />
                <h3 className="mt-2 font-display text-lg text-foreground">
                  Read this story? Share your perspective.
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sign in to leave a rating and share your review with the NovelNest reading community.
                </p>
                <Link
                  to="/login"
                  className="mt-4 inline-flex h-9 items-center rounded-xl bg-midnight-gradient px-6 text-xs font-medium text-primary-foreground shadow-page transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow"
                >
                  Sign in to review
                </Link>
              </div>
            </Reveal>
          )}

          {/* ── Reviews List ── */}
          <div className="mt-8 space-y-4">
            {loadingReviews ? (
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-page">
                    <div className="flex items-start gap-3">
                      <div className="size-10 animate-pulse rounded-full bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
                        <div className="h-3 w-1/3 animate-pulse rounded bg-muted/60" />
                        <div className="mt-3 h-12 animate-pulse rounded bg-muted/40" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : reviewsError ? (
              <div className="flex items-start gap-3 rounded-2xl border border-wine/30 bg-wine/10 p-5">
                <AlertCircle className="mt-0.5 size-5 shrink-0 text-wine" />
                <div>
                  <p className="font-display text-lg text-foreground">Couldn't load reviews</p>
                  <p className="mt-1 text-sm text-muted-foreground">{reviewsError}</p>
                  <button
                    type="button"
                    onClick={loadReviews}
                    className="mt-3 inline-flex h-8 items-center rounded-lg border border-wine/40 px-3 text-xs font-medium text-wine hover:bg-wine/10"
                  >
                    Try again
                  </button>
                </div>
              </div>
            ) : reviews.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center shadow-page">
                <PenLine className="mx-auto size-8 text-muted-foreground/40" />
                <h3 className="mt-3 font-display text-xl text-foreground">
                  No reviews yet for this novel
                </h3>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                  Be the first reader to share a review and help fellow book lovers discover this story.
                </p>
              </div>
            ) : (
              reviews.map((rev) => {
                const isAuthor = user && user.id === rev.user_id;
                const authorName =
                  rev.profiles?.full_name || rev.profiles?.username || "NovelNest Reader";
                const username = rev.profiles?.username;
                const relativeTime = formatDistanceToNow(new Date(rev.created_at), {
                  addSuffix: true,
                });

                return (
                  <article
                    key={rev.id}
                    className={cn(
                      "rounded-2xl border bg-card p-5 shadow-page transition-all duration-300 hover:border-gold/50",
                      isAuthor ? "border-gold/40 bg-gold/5" : "border-border"
                    )}
                  >
                    <header className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {username ? (
                          <Link to="/readers/$handle" params={{ handle: username }}>
                            <ReviewerAvatar profile={rev.profiles} />
                          </Link>
                        ) : (
                          <ReviewerAvatar profile={rev.profiles} />
                        )}

                        <div>
                          <div className="flex flex-wrap items-center gap-x-2">
                            {username ? (
                              <Link
                                to="/readers/$handle"
                                params={{ handle: username }}
                                className="font-display text-lg text-foreground hover:text-wine transition-colors"
                              >
                                {authorName}
                              </Link>
                            ) : (
                              <span className="font-display text-lg text-foreground">
                                {authorName}
                              </span>
                            )}
                            {isAuthor && (
                              <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold">
                                You
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2">
                            <StarRating rating={rev.rating} size="sm" />
                            <span className="text-xs text-muted-foreground">· {relativeTime}</span>
                          </div>
                        </div>
                      </div>

                      {/* Edit/Delete controls for review owner */}
                      {isAuthor && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(rev)}
                            aria-label="Edit review"
                            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                          >
                            <Edit3 className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(rev.id)}
                            aria-label="Delete review"
                            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-wine/10 hover:text-wine"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      )}
                    </header>

                    <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-foreground/90">
                      {rev.content}
                    </p>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
