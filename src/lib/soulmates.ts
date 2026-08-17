import { supabase } from "@/integrations/supabase/client";

export interface ProfileData {
  id: string;
  full_name: string | null;
  username: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  favorite_genres?: string[] | null;
  favorite_authors?: string[] | null;
  currently_reading?: string | null;
}

export interface SoulmateResult {
  id: string;
  name: string;
  username: string;
  bio: string;
  avatar_url: string | null;
  initials: string;
  match: number;
  interests: string[];
  isFollowing?: boolean;
}

const GENRE_ICONS: Record<string, string> = {
  romance: "❤️",
  mystery: "🕵️",
  fantasy: "✨",
  drama: "🎭",
  historical: "🏛️",
  thriller: "⚡",
  spiritual: "🕊️",
  poetry: "📜",
  literary: "📖",
  "sci-fi": "🚀",
  science: "🔬",
  adventure: "🧭",
  horror: "🕯️",
  classic: "📚",
};

/**
 * Transparent literary compatibility algorithm:
 * - Shared favorite genres: up to 50%
 * - Shared favorite authors: up to 30%
 * - Shared currently reading interests: up to 20%
 * Returns a normalized score from 0-100 and a list of formatted shared interests.
 */
export function calculateSoulmateMatch(
  currentProfile: ProfileData,
  otherProfile: ProfileData
): { matchPercentage: number; sharedInterests: string[] } {
  const genresA = (currentProfile.favorite_genres ?? []).map((g) => g.trim()).filter(Boolean);
  const genresB = (otherProfile.favorite_genres ?? []).map((g) => g.trim()).filter(Boolean);

  const authorsA = (currentProfile.favorite_authors ?? []).map((a) => a.trim()).filter(Boolean);
  const authorsB = (otherProfile.favorite_authors ?? []).map((a) => a.trim()).filter(Boolean);

  const readingA = (currentProfile.currently_reading ?? "").trim();
  const readingB = (otherProfile.currently_reading ?? "").trim();

  // 1. Shared genres (case-insensitive deduplication)
  const sharedGenres: string[] = [];
  for (const gA of genresA) {
    const match = genresB.find((gB) => gB.toLowerCase() === gA.toLowerCase());
    if (match && !sharedGenres.some((sg) => sg.toLowerCase() === match.toLowerCase())) {
      sharedGenres.push(match);
    }
  }

  // 2. Shared authors (case-insensitive exact or substring match)
  const sharedAuthors: string[] = [];
  for (const aA of authorsA) {
    const match = authorsB.find(
      (aB) =>
        aB.toLowerCase() === aA.toLowerCase() ||
        (aA.length >= 4 && aB.toLowerCase().includes(aA.toLowerCase())) ||
        (aB.length >= 4 && aA.toLowerCase().includes(aB.toLowerCase()))
    );
    if (match && !sharedAuthors.some((sa) => sa.toLowerCase() === match.toLowerCase())) {
      sharedAuthors.push(match);
    }
  }

  // 3. Similar currently-reading interests
  let sharedReading: string | null = null;
  if (readingA && readingB) {
    const rALower = readingA.toLowerCase();
    const rBLower = readingB.toLowerCase();
    if (
      rALower === rBLower ||
      (rALower.length >= 4 && rBLower.includes(rALower)) ||
      (rBLower.length >= 4 && rALower.includes(rBLower))
    ) {
      sharedReading = readingB;
    }
  }

  // If no overlaps at all, return 0
  if (sharedGenres.length === 0 && sharedAuthors.length === 0 && !sharedReading) {
    return { matchPercentage: 0, sharedInterests: [] };
  }

  // Calculate component scores
  let genreScore = 0;
  if (genresA.length > 0 && genresB.length > 0) {
    const unionGenres = new Set([
      ...genresA.map((g) => g.toLowerCase()),
      ...genresB.map((g) => g.toLowerCase()),
    ]);
    const jaccard = sharedGenres.length / Math.max(1, unionGenres.size);
    // Base weight 50% + bonus for raw count of shared favorites
    genreScore = jaccard * 50;
  }

  let authorScore = 0;
  if (authorsA.length > 0 && authorsB.length > 0) {
    const unionAuthors = new Set([
      ...authorsA.map((a) => a.toLowerCase()),
      ...authorsB.map((a) => a.toLowerCase()),
    ]);
    const jaccard = sharedAuthors.length / Math.max(1, unionAuthors.size);
    authorScore = jaccard * 30;
  }

  let readingScore = 0;
  if (sharedReading) {
    readingScore = 20;
  }

  let rawTotal = genreScore + authorScore + readingScore;

  // Connection scaling based on shared quantity
  if (sharedGenres.length >= 2 && sharedAuthors.length >= 1) {
    rawTotal = Math.max(rawTotal, 78 + (sharedGenres.length - 2) * 5 + (sharedAuthors.length - 1) * 8);
  } else if (sharedGenres.length >= 1 && sharedAuthors.length >= 1) {
    rawTotal = Math.max(rawTotal, 65 + (sharedGenres.length - 1) * 6);
  } else if (sharedGenres.length >= 2) {
    rawTotal = Math.max(rawTotal, 55 + (sharedGenres.length - 2) * 8);
  } else if (sharedAuthors.length >= 1) {
    rawTotal = Math.max(rawTotal, 50 + (sharedAuthors.length - 1) * 12);
  } else if (sharedGenres.length === 1) {
    rawTotal = Math.max(rawTotal, 35);
  }

  if (sharedReading) {
    rawTotal = Math.min(100, rawTotal + 15);
  }

  const matchPercentage = Math.min(100, Math.max(0, Math.round(rawTotal)));

  // Build shared interests tags
  const sharedInterests: string[] = [];
  for (const g of sharedGenres) {
    const icon = GENRE_ICONS[g.toLowerCase()] || "🏷️";
    sharedInterests.push(`${icon} ${g}`);
  }
  for (const a of sharedAuthors) {
    sharedInterests.push(`✍️ ${a}`);
  }
  if (sharedReading) {
    sharedInterests.push(`📖 ${sharedReading}`);
  }

  return {
    matchPercentage,
    sharedInterests,
  };
}

/**
 * Batch loads soulmates for a given user profile by querying all profiles and current follows.
 */
export async function loadUserSoulmates(
  currentUserId: string,
  currentProfile: ProfileData
): Promise<SoulmateResult[]> {
  const hasPreferences =
    (currentProfile.favorite_genres && currentProfile.favorite_genres.length > 0) ||
    (currentProfile.favorite_authors && currentProfile.favorite_authors.length > 0) ||
    Boolean(currentProfile.currently_reading?.trim());

  if (!hasPreferences) {
    return [];
  }

  // Fetch other profiles and user's following list in parallel
  const [profilesRes, followsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, username, bio, avatar_url, favorite_genres, favorite_authors, currently_reading")
      .neq("id", currentUserId),
    supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", currentUserId),
  ]);

  if (profilesRes.error || !profilesRes.data) {
    console.warn("Failed to fetch profiles for soulmates:", profilesRes.error);
    return [];
  }

  const followingSet = new Set((followsRes.data ?? []).map((f) => f.following_id));

  const results: SoulmateResult[] = [];

  for (const other of profilesRes.data) {
    const otherProfile: ProfileData = {
      id: other.id,
      full_name: other.full_name,
      username: other.username,
      bio: other.bio,
      avatar_url: other.avatar_url,
      favorite_genres: other.favorite_genres,
      favorite_authors: other.favorite_authors,
      currently_reading: other.currently_reading,
    };

    const { matchPercentage, sharedInterests } = calculateSoulmateMatch(currentProfile, otherProfile);

    // Only include meaningful matches (score > 0)
    if (matchPercentage > 0) {
      const name = other.full_name || other.username || "Reader";
      const initials = name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() || "R";

      results.push({
        id: other.id,
        name,
        username: other.username || other.id.slice(0, 8),
        bio: other.bio || "",
        avatar_url: other.avatar_url,
        initials,
        match: matchPercentage,
        interests: sharedInterests,
        isFollowing: followingSet.has(other.id),
      });
    }
  }

  // Sort descending by highest match percentage first
  results.sort((a, b) => b.match - a.match);

  return results;
}
