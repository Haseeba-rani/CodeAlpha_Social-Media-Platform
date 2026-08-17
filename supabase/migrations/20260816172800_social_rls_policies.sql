-- ============================================================
-- NovelNest — Social Features RLS Policies
-- ============================================================

-- ── Profiles ────────────────────────────────────────────────
-- Allow all authenticated users to view any profile
-- (needed for readers list, reader profile pages, post authors)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can only update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── Posts ───────────────────────────────────────────────────
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;

CREATE POLICY "Authenticated users can read all posts"
  ON public.posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own posts"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own posts"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own posts"
  ON public.posts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ── Comments ────────────────────────────────────────────────
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;

CREATE POLICY "Authenticated users can read all comments"
  ON public.comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own comments"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
  ON public.comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ── Likes ───────────────────────────────────────────────────
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON public.likes TO authenticated;
GRANT ALL ON public.likes TO service_role;

CREATE POLICY "Authenticated users can read all likes"
  ON public.likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can like posts"
  ON public.likes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unlike posts"
  ON public.likes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ── Follows ─────────────────────────────────────────────────
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;

CREATE POLICY "Authenticated users can read all follows"
  ON public.follows FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can follow others"
  ON public.follows FOR INSERT
  TO authenticated
  WITH CHECK (follower_id = auth.uid() AND follower_id != following_id);

CREATE POLICY "Users can unfollow"
  ON public.follows FOR DELETE
  TO authenticated
  USING (follower_id = auth.uid());

-- ── Unique constraints (safety — add if not already present) ─
ALTER TABLE public.likes
  DROP CONSTRAINT IF EXISTS likes_user_id_post_id_key;
ALTER TABLE public.likes
  ADD CONSTRAINT likes_user_id_post_id_key UNIQUE (user_id, post_id);

ALTER TABLE public.follows
  DROP CONSTRAINT IF EXISTS follows_follower_id_following_id_key;
ALTER TABLE public.follows
  ADD CONSTRAINT follows_follower_id_following_id_key UNIQUE (follower_id, following_id);

-- Prevent self-follows via check constraint
ALTER TABLE public.follows
  DROP CONSTRAINT IF EXISTS follows_no_self_follow;
ALTER TABLE public.follows
  ADD CONSTRAINT follows_no_self_follow CHECK (follower_id != following_id);
