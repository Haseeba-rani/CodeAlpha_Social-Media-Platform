import { BookOpen, Check, Edit3, Heart, Loader2, MessageCircle, MoreHorizontal, Send, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { notifyComment, notifyLike } from "@/lib/notifications";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PostAuthor {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  currently_reading: string;
}

export interface PostData {
  id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  user_id: string;
  author: PostAuthor;
}

interface CommentRow {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    username: string;
  } | null;
}

interface PostCardProps {
  post: PostData;
  initialLikeCount: number;
  isLikedByCurrentUser: boolean;
  initialCommentCount: number;
  currentUserId: string | null;
  onDeleted?: (postId: string) => void;
}

// ─── Avatar helper ────────────────────────────────────────────────────────

function AuthorAvatar({ author }: { author: PostAuthor }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!author.avatar_url) return;
    if (author.avatar_url.startsWith("http")) {
      setSrc(author.avatar_url);
      return;
    }
    supabase.storage
      .from("avatars")
      .createSignedUrl(author.avatar_url, 3600)
      .then(({ data }) => setSrc(data?.signedUrl ?? null));
  }, [author.avatar_url]);

  const initials = (author.full_name || author.username || "R")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={author.full_name}
        className="size-11 shrink-0 rounded-full object-cover ring-2 ring-gold/25 transition-transform duration-500 group-hover:scale-105"
      />
    );
  }
  return (
    <span
      role="img"
      aria-label={author.full_name}
      className="inline-flex size-11 shrink-0 select-none items-center justify-center rounded-full bg-midnight-gradient font-display text-sm font-semibold tracking-wide text-primary-foreground ring-2 ring-gold/25 transition-transform duration-500 group-hover:scale-105"
    >
      {initials}
    </span>
  );
}

// ─── PostCard ─────────────────────────────────────────────────────────────

export function PostCard({
  post,
  initialLikeCount,
  isLikedByCurrentUser,
  initialCommentCount,
  currentUserId,
  onDeleted,
}: PostCardProps) {
  const [liked, setLiked] = useState(isLikedByCurrentUser);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [pop, setPop] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);

  const [openComments, setOpenComments] = useState(false);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const [showOptions, setShowOptions] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);

  // Post Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [currentContent, setCurrentContent] = useState(post.content);
  const [editContent, setEditContent] = useState(post.content);
  const [savingEdit, setSavingEdit] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | undefined>(post.updated_at);

  const isOwner = currentUserId === post.user_id;

  // Close options menu on outside click
  useEffect(() => {
    if (!showOptions) return;
    const handler = (e: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target as Node)) {
        setShowOptions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showOptions]);

  // Load comments when opening
  useEffect(() => {
    if (!openComments) return;
    setCommentsLoading(true);
    supabase
      .from("comments")
      .select("id, content, created_at, user_id, profiles(full_name, username)")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        setCommentsLoading(false);
        if (error) {
          toast.error("Couldn't load comments.");
          return;
        }
        setComments((data as CommentRow[]) ?? []);
      });
  }, [openComments, post.id]);

  // Real-time subscriptions for likes & comments on this post
  useEffect(() => {
    const channel = supabase
      .channel(`post-realtime-${post.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "likes",
          filter: `post_id=eq.${post.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newLike = payload.new as { user_id: string; post_id: string };
            if (newLike.user_id !== currentUserId) {
              setLikeCount((n) => n + 1);
            }
          } else if (payload.eventType === "DELETE") {
            const oldLike = payload.old as { user_id?: string; post_id?: string };
            if (oldLike?.user_id && oldLike.user_id !== currentUserId) {
              setLikeCount((n) => Math.max(0, n - 1));
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${post.id}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const newCommentRow = payload.new as {
              id: string;
              content: string;
              created_at: string;
              user_id: string;
              post_id: string;
            };

            if (newCommentRow.user_id !== currentUserId) {
              setCommentCount((n) => n + 1);

              if (openComments) {
                const { data: prof } = await supabase
                  .from("profiles")
                  .select("full_name, username")
                  .eq("id", newCommentRow.user_id)
                  .single();

                const formattedComment: CommentRow = {
                  id: newCommentRow.id,
                  content: newCommentRow.content,
                  created_at: newCommentRow.created_at,
                  user_id: newCommentRow.user_id,
                  profiles: prof ?? null,
                };

                setComments((prev) => {
                  if (prev.some((c) => c.id === newCommentRow.id)) return prev;
                  return [...prev, formattedComment];
                });
              }
            }
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as { id?: string })?.id;
            if (deletedId) {
              setComments((prev) => {
                const exists = prev.some((c) => c.id === deletedId);
                if (exists) {
                  setCommentCount((n) => Math.max(0, n - 1));
                  return prev.filter((c) => c.id !== deletedId);
                }
                return prev;
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [post.id, currentUserId, openComments]);

  const toggleLike = async () => {
    if (!currentUserId || likeBusy) return;
    setLikeBusy(true);

    // Optimistic update
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((n) => n + (nextLiked ? 1 : -1));
    setPop(true);
    window.setTimeout(() => setPop(false), 450);

    if (nextLiked) {
      const { error } = await supabase
        .from("likes")
        .insert({ post_id: post.id, user_id: currentUserId });
      if (error) {
        // Rollback
        setLiked(false);
        setLikeCount((n) => n - 1);
        toast.error("Couldn't save your like.");
      } else {
        void notifyLike(post.user_id, currentUserId, post.id);
      }
    } else {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", currentUserId);
      if (error) {
        // Rollback
        setLiked(true);
        setLikeCount((n) => n + 1);
        toast.error("Couldn't remove your like.");
      }
    }
    setLikeBusy(false);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newComment.trim();
    if (!trimmed || !currentUserId || submittingComment) return;

    setSubmittingComment(true);
    const { data, error } = await supabase
      .from("comments")
      .insert({ post_id: post.id, user_id: currentUserId, content: trimmed })
      .select("id, content, created_at, user_id, profiles(full_name, username)")
      .single();
    setSubmittingComment(false);

    if (error || !data) {
      toast.error("Couldn't add your comment.");
      return;
    }

    void notifyComment(post.user_id, currentUserId, post.id, (data as CommentRow).id);

    setComments((prev) => [...prev, data as CommentRow]);
    setCommentCount((n) => n + 1);
    setNewComment("");
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);
    if (error) {
      toast.error("Couldn't remove that comment.");
      return;
    }
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setCommentCount((n) => Math.max(0, n - 1));
  };

  const handleDeletePost = async () => {
    if (!isOwner) return;
    setDeleting(true);
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    setDeleting(false);
    setShowOptions(false);
    if (error) {
      toast.error("Couldn't delete your post.");
      return;
    }
    toast.success("Your thought has been removed from the room.");
    onDeleted?.(post.id);
  };

  // ── Post Editing Handlers ──
  const handleStartEdit = () => {
    setEditContent(currentContent);
    setIsEditing(true);
    setShowOptions(false);
  };

  const handleCancelEdit = () => {
    setEditContent(currentContent);
    setIsEditing(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = editContent.trim();
    if (!trimmed || !isOwner || savingEdit) return;

    if (trimmed.length > 2000) {
      toast.error("Thoughts are limited to 2,000 characters.");
      return;
    }

    if (trimmed === currentContent) {
      setIsEditing(false);
      return;
    }

    setSavingEdit(true);
    const nowIso = new Date().toISOString();

    const { error } = await supabase
      .from("posts")
      .update({ content: trimmed, updated_at: nowIso })
      .eq("id", post.id)
      .eq("user_id", currentUserId!);

    setSavingEdit(false);

    if (error) {
      toast.error("Couldn't save changes to your post. Please try again.");
      return;
    }

    setCurrentContent(trimmed);
    setUpdatedAt(nowIso);
    setIsEditing(false);
    toast.success("Your thought has been updated.");
  };

  const relativeTime = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
  });

  const wasEdited = updatedAt && updatedAt !== post.created_at;

  return (
    <article className="group rounded-2xl border border-border bg-card p-5 shadow-page transition-all duration-500 hover:-translate-y-1 hover:border-gold/50 hover:shadow-lift">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="flex items-start gap-3">
        <Link to="/readers/$handle" params={{ handle: post.author.username }}>
          <AuthorAvatar author={post.author} />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2">
            <Link
              to="/readers/$handle"
              params={{ handle: post.author.username }}
              className="font-display text-xl text-foreground transition-colors duration-300 hover:text-wine group-hover:text-wine"
            >
              {post.author.full_name || post.author.username}
            </Link>
            <span className="text-xs text-muted-foreground">
              @{post.author.username} · {relativeTime}
              {wasEdited && <span className="ml-1 text-[11px] opacity-75">(edited)</span>}
            </span>
          </div>
          {post.author.currently_reading && (
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <BookOpen className="size-3.5" />
              <span className="font-medium text-foreground/80">Currently reading:</span>
              {post.author.currently_reading}
            </p>
          )}
        </div>

        {/* Options menu (owner only) */}
        {isOwner && !isEditing && (
          <div className="relative" ref={optionsRef}>
            <button
              type="button"
              aria-label="Post options"
              onClick={() => setShowOptions((s) => !s)}
              className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-all duration-300 hover:bg-accent hover:text-accent-foreground"
            >
              <MoreHorizontal className="size-4" />
            </button>
            {showOptions && (
              <div className="absolute right-0 top-10 z-10 min-w-[150px] rounded-xl border border-border bg-card p-1 shadow-lift">
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary hover:text-wine"
                >
                  <Edit3 className="size-3.5" />
                  Edit thought
                </button>
                <button
                  type="button"
                  onClick={handleDeletePost}
                  disabled={deleting}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-wine transition-colors hover:bg-wine/10 disabled:opacity-60"
                >
                  {deleting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                  Delete post
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* ── Content / Edit Mode ──────────────────────────────── */}
      {isEditing ? (
        <form onSubmit={handleSaveEdit} className="mt-4 space-y-3">
          <div className="relative">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              maxLength={2000}
              rows={4}
              disabled={savingEdit}
              autoFocus
              placeholder="Edit your literary thought..."
              className="w-full resize-none rounded-xl border border-gold/60 bg-background/95 px-3.5 py-2.5 text-[15px] leading-relaxed text-foreground shadow-page outline-none backdrop-blur transition-all duration-300 placeholder:text-muted-foreground focus:border-gold focus:shadow-glow"
            />
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>{editContent.length}/2000 characters</span>
              {editContent.length >= 1900 && (
                <span className="font-medium text-wine">
                  {2000 - editContent.length} characters left
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={savingEdit}
              className="inline-flex h-8.5 items-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-3.5 text-xs font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-foreground active:scale-95 disabled:opacity-50"
            >
              <X className="size-3.5" /> Cancel
            </button>
            <button
              type="submit"
              disabled={savingEdit || !editContent.trim() || editContent.trim() === currentContent}
              className="inline-flex h-8.5 cursor-pointer items-center gap-1.5 rounded-lg bg-gold px-4 text-xs font-medium text-gold-foreground shadow-page transition-all duration-300 hover:shadow-glow active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingEdit ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Check className="size-3.5" />
              )}
              {savingEdit ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-foreground/90">
          {currentContent}
        </p>
      )}

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="mt-4 flex items-center gap-1 border-t border-border pt-3">
        <button
          type="button"
          aria-pressed={liked}
          aria-label={liked ? "Unlike this post" : "Like this post"}
          onClick={toggleLike}
          disabled={!currentUserId || likeBusy}
          className={cn(
            "inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-300 hover:bg-wine/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:opacity-60",
            liked ? "text-wine" : "text-muted-foreground hover:text-wine",
          )}
        >
          <Heart
            className={cn("size-4 transition-colors", pop && "animate-pop")}
            fill={liked ? "currentColor" : "none"}
          />
          <span className="tabular-nums">{likeCount}</span>
          <span className="hidden sm:inline">Likes</span>
        </button>

        <button
          type="button"
          onClick={() => setOpenComments((o) => !o)}
          aria-expanded={openComments}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MessageCircle
            className={cn(
              "size-4 transition-transform duration-300",
              openComments && "-rotate-12 text-wine",
            )}
          />
          <span className="tabular-nums">{commentCount}</span>
          <span className="hidden sm:inline">Comments</span>
        </button>
      </footer>

      {/* ── Comments panel ──────────────────────────────────── */}
      <div
        className={cn(
          "grid transition-all duration-500 ease-out motion-reduce:transition-none",
          openComments ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="mt-3 border-t border-border pt-3">
            {commentsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="flex gap-2.5">
                    <div className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-2/3 animate-pulse rounded bg-muted/70" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="space-y-3">
                {comments.map((c, i) => {
                  const commentInitials = (
                    c.profiles?.full_name ||
                    c.profiles?.username ||
                    "R"
                  )
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  return (
                    <li
                      key={c.id}
                      className="flex gap-2.5 transition-all duration-500"
                      style={{
                        transitionDelay: openComments ? `${i * 60}ms` : "0ms",
                        opacity: openComments ? 1 : 0,
                        transform: openComments ? "none" : "translateY(6px)",
                      }}
                    >
                      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-midnight-gradient font-display text-[11px] font-semibold text-primary-foreground">
                        {commentInitials}
                      </span>
                      <div className="flex-1 rounded-2xl rounded-tl-sm bg-secondary/60 px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-display text-sm text-foreground">
                            {c.profiles?.full_name || c.profiles?.username || "Reader"}
                          </p>
                          {currentUserId === c.user_id && (
                            <button
                              type="button"
                              aria-label="Delete comment"
                              onClick={() => handleDeleteComment(c.id)}
                              className="text-muted-foreground/50 transition-colors hover:text-wine"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-foreground/85">{c.content}</p>
                      </div>
                    </li>
                  );
                })}

                {comments.length === 0 && !commentsLoading && (
                  <li className="py-2 text-center text-sm text-muted-foreground">
                    No comments yet. Be the first to share a thought.
                  </li>
                )}
              </ul>
            )}

            {/* Add comment */}
            {currentUserId && (
              <form
                onSubmit={handleAddComment}
                className="mt-3 flex items-center gap-2"
              >
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  maxLength={500}
                  placeholder="Add your thought…"
                  className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none transition-all duration-300 focus:border-gold focus:shadow-glow"
                />
                <button
                  type="submit"
                  disabled={submittingComment || !newComment.trim()}
                  aria-label="Send comment"
                  className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full bg-midnight-gradient text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submittingComment ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
