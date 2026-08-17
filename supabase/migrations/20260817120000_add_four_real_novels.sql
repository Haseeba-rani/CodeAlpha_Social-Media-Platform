-- ============================================================
-- NovelNest — Add 4 Real Novels to Catalog
-- ============================================================

INSERT INTO public.novels (id, title, author, slug, rating, readers_label, genres, cover_url, description)
VALUES
  (
    'a1b2c3d4-0001-4000-8000-000000000001',
    'It Ends with Us',
    'Colleen Hoover',
    'it-ends-with-us',
    4.6,
    '2,840',
    ARRAY['Romance', 'Drama'],
    '/cover-5.jpg',
    'Lily hasn''t always had it easy, but that''s never stopped her from working hard for the life she wants. When she feels a spark with a handsome neurosurgeon named Ryle Kincaid, everything in Lily''s life suddenly seems almost too good to be true. A courageous and deeply emotional novel about resilience, love, and the strength it takes to break the cycle.'
  ),
  (
    'a1b2c3d4-0002-4000-8000-000000000002',
    'Until Love Sets Us Apart',
    'Aditya Nighhot',
    'until-love-sets-us-apart',
    4.5,
    '1,420',
    ARRAY['Romance', 'Drama', 'Thriller'],
    '/cover-6.jpg',
    'Can love survive when fate turns ruthless? Rohit and Aisha believe their bond is unbreakable until a devastating twist of events shatters their world. A poignant, emotionally gripping saga of romance, sacrifice, and the enduring resilience of the human heart through trials of love and tragedy.'
  ),
  (
    'a1b2c3d4-0003-4000-8000-000000000003',
    'The Forty Rules of Love',
    'Elif Shafak',
    'the-forty-rules-of-love',
    4.7,
    '3,150',
    ARRAY['Spiritual', 'Historical', 'Literary'],
    '/cover-7.jpg',
    'Ella Rubinstein is an unfulfilled housewife who takes a job as a reader for a literary agent. Her first assignment, Sweet Blasphemy, chronicles the profound 13th-century spiritual friendship between the poet Rumi and the wandering mystic Shams of Tabriz. A timeless masterpiece exploring the transformative power of divine and earthly love.'
  ),
  (
    'a1b2c3d4-0004-4000-8000-000000000004',
    'I Don''t Love You Anymore',
    'Rithvik Singh',
    'i-dont-love-you-anymore',
    4.5,
    '1,890',
    ARRAY['Romance', 'Poetry', 'Drama'],
    '/cover-8.jpg',
    'A comforting and deeply relatable collection of poetry and prose for anyone healing from heartbreak, unspoken grief, and learning to let go. Rithvik Singh''s gentle, honest words remind us that choosing self-worth and moving on is an act of courage, offering solace to weary hearts discovering light after painful goodbyes.'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  author = EXCLUDED.author,
  slug = EXCLUDED.slug,
  rating = EXCLUDED.rating,
  readers_label = EXCLUDED.readers_label,
  genres = EXCLUDED.genres,
  cover_url = EXCLUDED.cover_url,
  description = EXCLUDED.description;
