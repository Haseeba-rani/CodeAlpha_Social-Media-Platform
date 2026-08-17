-- ============================================================
-- NovelNest — Reviews RLS Policies & Constraints
-- ============================================================

-- ── Reviews ─────────────────────────────────────────────────
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

-- Allow everyone (authenticated and anonymous) to view reviews
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can read all reviews" ON public.reviews;

CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  USING (true);

-- Authenticated users can insert their own review
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.reviews;
CREATE POLICY "Authenticated users can create reviews"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update only their own reviews
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update their own reviews"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete only their own reviews
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;
CREATE POLICY "Users can delete their own reviews"
  ON public.reviews FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ── Unique constraint & checks ──────────────────────────────
-- One review per user per novel
ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_user_id_novel_id_key;
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_user_id_novel_id_key UNIQUE (user_id, novel_id);

-- Rating range constraint (1 to 5 stars)
ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_rating_check;
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_rating_check CHECK (rating >= 1 AND rating <= 5);
