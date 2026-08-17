import { supabase } from "@/integrations/supabase/client";

export type NotificationType = "follow" | "like" | "comment" | "review";

export interface NotificationActor {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  actor_id: string;
  type: NotificationType;
  post_id: string | null;
  comment_id: string | null;
  novel_id: string | null;
  read: boolean;
  created_at: string;
  actor: NotificationActor | null;
  post: { id: string; content: string } | null;
  novel: { id: string; title: string; slug: string | null } | null;
}

/**
 * Creates a notification in Supabase.
 * Silently skips if actor is the same as recipient (no self-notifications).
 */
export async function createNotification(params: {
  userId: string;
  actorId: string;
  type: NotificationType;
  postId?: string | null;
  commentId?: string | null;
  novelId?: string | null;
}) {
  if (!params.userId || !params.actorId || params.userId === params.actorId) {
    return { data: null, error: null };
  }

  try {
    const { data, error } = await supabase.from("notifications").insert({
      user_id: params.userId,
      actor_id: params.actorId,
      type: params.type,
      post_id: params.postId ?? null,
      comment_id: params.commentId ?? null,
      novel_id: params.novelId ?? null,
      read: false,
    });

    return { data, error };
  } catch (err) {
    console.warn("[Notifications] Failed to create notification:", err);
    return { data: null, error: err };
  }
}

/**
 * Notify when a user follows another reader
 */
export async function notifyFollow(targetUserId: string, actorId: string) {
  return createNotification({
    userId: targetUserId,
    actorId,
    type: "follow",
  });
}

/**
 * Notify when a user likes another reader's post
 */
export async function notifyLike(postOwnerId: string, actorId: string, postId: string) {
  return createNotification({
    userId: postOwnerId,
    actorId,
    type: "like",
    postId,
  });
}

/**
 * Notify when a user comments on another reader's post
 */
export async function notifyComment(
  postOwnerId: string,
  actorId: string,
  postId: string,
  commentId?: string
) {
  return createNotification({
    userId: postOwnerId,
    actorId,
    type: "comment",
    postId,
    commentId: commentId ?? null,
  });
}

/**
 * Get count of unread notifications for a user
 */
export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  if (!userId) return 0;
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) throw error;
    return count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  return supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId);
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  if (!userId) return;
  return supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
}

/**
 * Delete a single notification
 */
export async function deleteNotification(notificationId: string) {
  return supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId);
}
