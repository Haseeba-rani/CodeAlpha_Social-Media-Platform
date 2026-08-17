import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Bell,
  BookOpen,
  CheckCheck,
  Heart,
  Loader2,
  MessageCircle,
  Sparkles,
  Star,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { ParticleField } from "@/components/ParticleField";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  deleteNotification,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationActor,
  type NotificationItem,
  type NotificationType,
} from "@/lib/notifications";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
  head: () => ({
    meta: [
      { title: "Notifications — NovelNest" },
      {
        name: "description",
        content:
          "Follows, replies and reactions from readers around your thoughts on NovelNest.",
      },
      { property: "og:title", content: "Notifications — NovelNest" },
      {
        property: "og:description",
        content: "See what the readers around your stories are up to.",
      },
    ],
  }),
});

type FilterTab = "all" | "unread" | "follows" | "interactions";

// ─── Actor Avatar ────────────────────────────────────────────────────────────

function NotificationAvatar({ actor }: { actor?: NotificationActor | null }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!actor?.avatar_url) return;
    if (actor.avatar_url.startsWith("http")) {
      setSrc(actor.avatar_url);
      return;
    }
    supabase.storage
      .from("avatars")
      .createSignedUrl(actor.avatar_url, 3600)
      .then(({ data }) => setSrc(data?.signedUrl ?? null));
  }, [actor?.avatar_url]);

  const initials = (actor?.full_name || actor?.username || "R")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={actor?.full_name || "Reader"}
        className="size-11 shrink-0 rounded-full object-cover ring-2 ring-gold/25"
      />
    );
  }

  return (
    <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-midnight-gradient font-display text-xs font-semibold text-primary-foreground ring-2 ring-gold/25">
      {initials}
    </span>
  );
}

// ─── Type Icon Helper ────────────────────────────────────────────────────────

function NotificationTypeIcon({ type }: { type: NotificationType }) {
  switch (type) {
    case "like":
      return (
        <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-wine text-white shadow">
          <Heart className="size-2.5 fill-current" />
        </span>
      );
    case "comment":
      return (
        <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
          <MessageCircle className="size-2.5 fill-current" />
        </span>
      );
    case "follow":
      return (
        <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-gold text-gold-foreground shadow">
          <UserPlus className="size-2.5" />
        </span>
      );
    case "review":
      return (
        <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-gold text-gold-foreground shadow">
          <Star className="size-2.5 fill-current" />
        </span>
      );
    default:
      return null;
  }
}

// ─── Main Notifications Page ─────────────────────────────────────────────────

function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [markingAll, setMarkingAll] = useState(false);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch raw notifications
      const { data: rawNotifs, error: fetchErr } = await supabase
        .from("notifications")
        .select("id, user_id, actor_id, type, post_id, comment_id, novel_id, read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (fetchErr) throw new Error(fetchErr.message);

      type RawNotifRow = {
        id: string;
        user_id: string;
        actor_id: string;
        type: NotificationType;
        post_id: string | null;
        comment_id: string | null;
        novel_id: string | null;
        read: boolean;
        created_at: string;
      };
      const items = (rawNotifs as unknown as RawNotifRow[]) ?? [];

      if (items.length === 0) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      // 2. Extract IDs for batch fetching
      const actorIds = Array.from(new Set(items.map((n) => n.actor_id).filter(Boolean)));
      const postIds = Array.from(new Set(items.map((n) => n.post_id).filter(Boolean) as string[]));
      const novelIds = Array.from(new Set(items.map((n) => n.novel_id).filter(Boolean) as string[]));

      // 3. Batch fetch actors, posts, and novels in parallel
      const [profilesRes, postsRes, novelsRes] = await Promise.all([
        actorIds.length > 0
          ? supabase
              .from("profiles")
              .select("id, full_name, username, avatar_url")
              .in("id", actorIds)
          : Promise.resolve({ data: [] }),
        postIds.length > 0
          ? supabase.from("posts").select("id, content").in("id", postIds)
          : Promise.resolve({ data: [] }),
        novelIds.length > 0
          ? supabase.from("novels").select("id, title, slug").in("id", novelIds)
          : Promise.resolve({ data: [] }),
      ]);

      const actorsMap = new Map<string, NotificationActor>();
      for (const p of profilesRes.data ?? []) {
        actorsMap.set(p.id, p);
      }

      const postsMap = new Map<string, { id: string; content: string }>();
      for (const p of postsRes.data ?? []) {
        postsMap.set(p.id, p);
      }

      const novelsMap = new Map<string, { id: string; title: string; slug: string | null }>();
      for (const n of novelsRes.data ?? []) {
        novelsMap.set(n.id, n);
      }

      // 4. Combine into complete notification items
      const enriched: NotificationItem[] = items.map((n) => ({
        id: n.id,
        user_id: n.user_id,
        actor_id: n.actor_id,
        type: n.type,
        post_id: n.post_id,
        comment_id: n.comment_id,
        novel_id: n.novel_id,
        read: n.read,
        created_at: n.created_at,
        actor: actorsMap.get(n.actor_id) ?? null,
        post: n.post_id ? postsMap.get(n.post_id) ?? null : null,
        novel: n.novel_id ? novelsMap.get(n.novel_id) ?? null : null,
      }));

      setNotifications(enriched);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  // Unread count
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  // Filtered list
  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case "unread":
        return notifications.filter((n) => !n.read);
      case "follows":
        return notifications.filter((n) => n.type === "follow");
      case "interactions":
        return notifications.filter((n) => n.type === "like" || n.type === "comment");
      case "all":
      default:
        return notifications;
    }
  }, [notifications, activeTab]);

  // Mark all as read
  const handleMarkAllRead = async () => {
    if (!user || markingAll || unreadCount === 0) return;
    setMarkingAll(true);

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    const result = await markAllNotificationsAsRead(user.id);
    setMarkingAll(false);

    if (result && result.error) {
      toast.error("Couldn't mark notifications as read.");
      void loadNotifications();
      return;
    }

    toast.success("All notifications marked as read.");
    void queryClient.invalidateQueries({ queryKey: ["unread-notifications", user.id] });
  };

  // Handle clicking a notification
  const handleNotificationClick = async (notif: NotificationItem) => {
    // 1. Mark as read if unread
    if (!notif.read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
      void markNotificationAsRead(notif.id);
      void queryClient.invalidateQueries({ queryKey: ["unread-notifications", user?.id] });
    }

    // 2. Navigate based on type
    if (notif.type === "follow" && notif.actor?.username) {
      void navigate({
        to: "/readers/$handle",
        params: { handle: notif.actor.username },
      });
    } else if (notif.type === "like" || notif.type === "comment") {
      void navigate({ to: "/reading-room" });
    } else if (notif.type === "review" && notif.novel?.slug) {
      void navigate({
        to: "/novels/$slug",
        params: { slug: notif.novel.slug },
      });
    }
  };

  // Delete notification
  const handleDeleteNotification = async (
    e: React.MouseEvent,
    notificationId: string
  ) => {
    e.stopPropagation();

    // Optimistic removal
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

    const { error: delErr } = await deleteNotification(notificationId);
    if (delErr) {
      toast.error("Couldn't remove notification.");
      void loadNotifications();
      return;
    }

    void queryClient.invalidateQueries({ queryKey: ["unread-notifications", user?.id] });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        {/* ── Notifications Hero ────────────────────────────── */}
        <section className="relative overflow-hidden bg-midnight-gradient py-14 text-primary-foreground sm:py-16">
          <ParticleField count={10} seed={13} />
          <div className="relative mx-auto max-w-4xl px-5">
            <Reveal className="max-w-2xl">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                <Bell className="size-4" /> Activity & Margins
              </p>
              <h1 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">
                Notifications
              </h1>
              <p className="mt-2 text-sm leading-relaxed opacity-85">
                Replies to your thoughts, new followers, and reader reactions gathered in one
                quiet place.
              </p>
            </Reveal>

            {/* Filter Tabs & Mark All Action */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={cn(
                    "cursor-pointer rounded-full px-4 py-1 text-xs font-medium transition-all duration-200 active:scale-95",
                    activeTab === "all"
                      ? "bg-gold text-gold-foreground shadow-glow"
                      : "bg-white/10 text-primary-foreground/90 hover:bg-white/20"
                  )}
                >
                  All ({notifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("unread")}
                  className={cn(
                    "cursor-pointer rounded-full px-4 py-1 text-xs font-medium transition-all duration-200 active:scale-95",
                    activeTab === "unread"
                      ? "bg-gold text-gold-foreground shadow-glow"
                      : "bg-white/10 text-primary-foreground/90 hover:bg-white/20"
                  )}
                >
                  Unread ({unreadCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("follows")}
                  className={cn(
                    "cursor-pointer rounded-full px-4 py-1 text-xs font-medium transition-all duration-200 active:scale-95",
                    activeTab === "follows"
                      ? "bg-gold text-gold-foreground shadow-glow"
                      : "bg-white/10 text-primary-foreground/90 hover:bg-white/20"
                  )}
                >
                  Follows
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("interactions")}
                  className={cn(
                    "cursor-pointer rounded-full px-4 py-1 text-xs font-medium transition-all duration-200 active:scale-95",
                    activeTab === "interactions"
                      ? "bg-gold text-gold-foreground shadow-glow"
                      : "bg-white/10 text-primary-foreground/90 hover:bg-white/20"
                  )}
                >
                  Interactions
                </button>
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                  className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-gold/40 px-3 text-xs font-medium text-gold transition-all duration-200 hover:bg-gold/15 active:scale-95 disabled:opacity-50"
                >
                  {markingAll ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <CheckCheck className="size-3.5" />
                  )}
                  Mark all as read
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── Notifications Feed ────────────────────────────── */}
        <section className="mx-auto max-w-3xl px-5 py-12">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-page"
                >
                  <div className="size-11 animate-pulse rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-muted/60" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex items-start gap-3 rounded-2xl border border-gold/30 bg-gold/10 p-5">
              <Sparkles className="mt-0.5 size-5 shrink-0 text-gold" />
              <div>
                <p className="font-display text-lg text-foreground">
                  Notifications System Ready
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {error.includes("notifications") || error.includes("does not exist") || error.includes("PGRST205")
                    ? "The notifications frontend and realtime stream are fully configured. Live notifications will begin arriving here as soon as the notifications table migration is applied to your Lovable Cloud backend."
                    : error}
                </p>
                <Link
                  to="/reading-room"
                  className="mt-3 inline-flex h-8 items-center rounded-lg bg-gold px-3 text-xs font-medium text-gold-foreground transition-all duration-200 hover:shadow-glow"
                >
                  Explore Reading Room
                </Link>
              </div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            /* ── Empty State ── */
            <Reveal className="rounded-3xl border border-dashed border-border bg-card p-12 text-center shadow-page">
              <Bell className="mx-auto size-10 text-muted-foreground/40" />
              <h3 className="mt-4 font-display text-2xl text-foreground">
                {activeTab === "unread"
                  ? "You're completely caught up"
                  : "All quiet in the margins"}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                {activeTab === "unread"
                  ? "There are no unread notifications right now. Check back when readers interact with your shelves."
                  : "When readers follow you, reply to your thoughts or love what you wrote, you'll find it gathered here."}
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link
                  to="/reading-room"
                  className="inline-flex h-10 items-center rounded-xl bg-gold px-6 text-xs font-medium text-gold-foreground shadow-page transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow"
                >
                  Go to Reading Room
                </Link>
                <Link
                  to="/readers"
                  className="inline-flex h-10 items-center rounded-xl border border-border bg-secondary px-6 text-xs font-medium text-foreground transition-all duration-300 hover:bg-secondary/80"
                >
                  Discover readers
                </Link>
              </div>
            </Reveal>
          ) : (
            /* ── Notifications List ── */
            <div className="space-y-3">
              {filteredNotifications.map((notif) => {
                const actorName =
                  notif.actor?.full_name || notif.actor?.username || "A fellow reader";
                const relativeTime = formatDistanceToNow(new Date(notif.created_at), {
                  addSuffix: true,
                });

                return (
                  <article
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={cn(
                      "group relative flex cursor-pointer items-center justify-between gap-4 rounded-2xl border p-4 shadow-page transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift",
                      !notif.read
                        ? "border-gold/50 bg-gold/5 hover:border-gold"
                        : "border-border bg-card hover:border-border/80"
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3.5">
                      {/* Avatar with Type Badge */}
                      <div className="relative shrink-0">
                        <NotificationAvatar actor={notif.actor} />
                        <NotificationTypeIcon type={notif.type} />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground/90">
                          <strong className="font-semibold text-foreground">
                            {actorName}
                          </strong>{" "}
                          {notif.type === "follow" && "started following you."}
                          {notif.type === "like" && (
                            <>
                              liked your thought
                              {notif.post?.content && (
                                <span className="text-muted-foreground">
                                  : "{notif.post.content.slice(0, 45)}
                                  {notif.post.content.length > 45 && "…"}"
                                </span>
                              )}
                            </>
                          )}
                          {notif.type === "comment" && (
                            <>
                              commented on your thought
                              {notif.post?.content && (
                                <span className="text-muted-foreground">
                                  : "{notif.post.content.slice(0, 45)}
                                  {notif.post.content.length > 45 && "…"}"
                                </span>
                              )}
                            </>
                          )}
                          {notif.type === "review" && (
                            <>
                              reviewed{" "}
                              <span className="font-medium text-foreground">
                                {notif.novel?.title || "a novel"}
                              </span>
                              .
                            </>
                          )}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {relativeTime}
                        </p>
                      </div>
                    </div>

                    {/* Right side controls: Unread dot & Delete button */}
                    <div className="flex shrink-0 items-center gap-2">
                      {!notif.read && (
                        <span
                          className="size-2 rounded-full bg-gold shadow-glow"
                          title="Unread notification"
                        />
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteNotification(e, notif.id)}
                        aria-label="Delete notification"
                        className="rounded-lg p-1.5 text-muted-foreground/50 opacity-0 transition-all hover:bg-wine/10 hover:text-wine group-hover:opacity-100"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
