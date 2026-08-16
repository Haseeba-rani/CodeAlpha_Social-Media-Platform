ALTER TABLE public.novels
  ADD COLUMN IF NOT EXISTS slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS readers_label text;

GRANT SELECT ON public.novels TO anon;
GRANT SELECT ON public.novels TO authenticated;
GRANT ALL ON public.novels TO service_role;

INSERT INTO public.novels (
  title,
  author,
  description,
  cover_url,
  genres,
  rating,
  slug,
  readers_label
)
VALUES
  (
    'Peer-e-Kamil',
    'Umera Ahmed',
    'A story readers keep returning to — as much for the conversations it starts as for the pages themselves.',
    '/cover-1.jpg',
    ARRAY['Romance'],
    4.8,
    'peer-e-kamil',
    '1,245'
  ),
  (
    'Jannat Kay Pattay',
    'Nimra Ahmed',
    'A story readers keep returning to — as much for the conversations it starts as for the pages themselves.',
    '/cover-2.jpg',
    ARRAY['Drama'],
    4.6,
    'jannat-kay-pattay',
    '986'
  ),
  (
    'The Lamplighter''s Street',
    'Iman Farooq',
    'A story readers keep returning to — as much for the conversations it starts as for the pages themselves.',
    '/cover-3.jpg',
    ARRAY['Mystery'],
    4.4,
    'the-lamplighter-street',
    '742'
  ),
  (
    'The Cartographer''s Daughter',
    'Elena Marchetti',
    'A story readers keep returning to — as much for the conversations it starts as for the pages themselves.',
    '/cover-4.jpg',
    ARRAY['Fantasy'],
    4.7,
    'the-cartographers-daughter',
    '1,108'
  )
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.reading_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  novel_id uuid REFERENCES public.novels(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'want-to-read',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, novel_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reading_list TO authenticated;
GRANT ALL ON public.reading_list TO service_role;

ALTER TABLE public.reading_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own reading list"
  ON public.reading_list FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can add novels to their own reading list"
  ON public.reading_list FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reading list entries"
  ON public.reading_list FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove novels from their own reading list"
  ON public.reading_list FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());