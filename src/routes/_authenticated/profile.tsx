import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError, useAuth } from "@/lib/auth";
import { resizeImage } from "@/lib/image";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "My Profile — NovelNest" },
      {
        name: "description",
        content: "Your NovelNest reader profile: your name, your genres, your authors and the novel you're living in right now.",
      },
      { property: "og:title", content: "My Profile — NovelNest" },
      {
        property: "og:description",
        content: "Your reader profile, genres and currently reading shelf on NovelNest.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const GENRES = [
  "Romance",
  "Mystery",
  "Fantasy",
  "Drama",
  "Historical",
  "Thriller",
  "Spiritual",
  "Poetry",
  "Literary",
];

const inputClass =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-page outline-none transition-all duration-300 focus:border-gold focus:shadow-glow";

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="size-20 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-28 w-full rounded-xl" />
    </div>
  );
}

function ProfilePage() {
  const { profile, profileLoading, refreshProfile, user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [authorsText, setAuthorsText] = useState("");
  const [currentlyReading, setCurrentlyReading] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setUsername(profile.username ?? "");
    setBio(profile.bio ?? "");
    setGenres(profile.favorite_genres ?? []);
    setAuthorsText((profile.favorite_authors ?? []).join(", "));
    setCurrentlyReading(profile.currently_reading ?? "");
  }, [profile]);

  useEffect(() => {
    let active = true;
    const path = profile?.avatar_url;
    if (!path) {
      setAvatarSrc(null);
      return;
    }
    if (path.startsWith("http")) {
      setAvatarSrc(path);
      return;
    }
    supabase.storage
      .from("avatars")
      .createSignedUrl(path, 60 * 60)
      .then(({ data }) => {
        if (active) setAvatarSrc(data?.signedUrl ?? null);
      });
    return () => {
      active = false;
    };
  }, [profile?.avatar_url]);

  const toggleGenre = (g: string) =>
    setGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = fullName.trim();
    const trimmedUsername = username.trim();
    if (!trimmedName) return setError("Please tell us the name readers should see.");
    if (!/^[a-zA-Z0-9._]{3,30}$/.test(trimmedUsername))
      return setError("Usernames use 3–30 letters, numbers, dots or underscores.");
    if (bio.length > 500) return setError("Keep your bio under 500 characters.");

    setSaving(true);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: trimmedName,
        username: trimmedUsername,
        bio: bio.trim(),
        favorite_genres: genres,
        favorite_authors: authorsText
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
        currently_reading: currentlyReading.trim(),
      })
      .eq("id", user!.id);
    setSaving(false);

    if (updateError) {
      const msg = updateError.message.includes("profiles_username_key")
        ? "That username is already taken by another reader."
        : friendlyAuthError(updateError.message);
      setError(msg);
      toast.error(msg);
      return;
    }
    await refreshProfile();
    toast.success("Your profile has been re-bound beautifully.");
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    setUploading(true);
    try {
      const blob = await resizeImage(file, 512);
      const path = `${user.id}/avatar-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (uploadError) throw uploadError;
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ avatar_url: path })
        .eq("id", user.id);
      if (profileError) throw profileError;
      await refreshProfile();
      toast.success("Your new portrait is on the shelf.");
    } catch (err) {
      toast.error(
        err instanceof Error ? friendlyAuthError(err.message) : "We couldn't upload that image.",
      );
    } finally {
      setUploading(false);
    }
  };

  const initials = (profile?.full_name || profile?.username || "R")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-16">
        {profileLoading && !profile ? (
          <ProfileSkeleton />
        ) : (
          <>
            <Reveal className="flex items-center gap-4">
              <div className="relative">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={`${profile?.full_name || "Reader"}'s profile picture`}
                    className="size-20 rounded-full object-cover ring-2 ring-gold/25"
                  />
                ) : (
                  <span className="inline-flex size-20 items-center justify-center rounded-full bg-midnight-gradient font-display text-2xl font-semibold text-primary-foreground ring-2 ring-gold/25">
                    {initials}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  aria-label="Change profile picture"
                  className="absolute -bottom-1 -right-1 inline-flex size-8 cursor-pointer items-center justify-center rounded-full bg-gold text-gold-foreground shadow-page transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow disabled:opacity-60"
                >
                  {uploading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Camera className="size-4" />
                  )}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatar}
                />
              </div>
              <div>
                <h1 className="font-display text-4xl text-foreground">
                  {profile?.full_name || "Your profile"}
                </h1>
                <p className="text-sm text-muted-foreground">@{profile?.username}</p>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <form onSubmit={handleSave} className="mt-8 space-y-5">
                <div className="space-y-2">
                  <label htmlFor="fullName" className="text-xs font-medium text-muted-foreground">
                    Full name
                  </label>
                  <input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    maxLength={100}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="username" className="text-xs font-medium text-muted-foreground">
                    Username
                  </label>
                  <input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    maxLength={30}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="bio" className="text-xs font-medium text-muted-foreground">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    maxLength={500}
                    placeholder="A line or two about the reader you are."
                    className={inputClass}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Favourite genres</p>
                  <div className="flex flex-wrap gap-2">
                    {GENRES.map((g) => {
                      const active = genres.includes(g);
                      return (
                        <button
                          key={g}
                          type="button"
                          aria-pressed={active}
                          onClick={() => toggleGenre(g)}
                          className={
                            active
                              ? "inline-flex cursor-pointer items-center rounded-full bg-gold px-3 py-1 text-xs font-medium text-gold-foreground shadow-glow transition-all duration-300"
                              : "inline-flex cursor-pointer items-center rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:bg-secondary/70"
                          }
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="authors" className="text-xs font-medium text-muted-foreground">
                    Favourite authors (comma separated)
                  </label>
                  <input
                    id="authors"
                    value={authorsText}
                    onChange={(e) => setAuthorsText(e.target.value)}
                    maxLength={300}
                    placeholder="Umera Ahmed, Nimra Ahmed"
                    className={inputClass}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="reading" className="text-xs font-medium text-muted-foreground">
                    Currently reading
                  </label>
                  <input
                    id="reading"
                    value={currentlyReading}
                    onChange={(e) => setCurrentlyReading(e.target.value)}
                    maxLength={120}
                    placeholder="Peer-e-Kamil"
                    className={inputClass}
                  />
                </div>

                {error ? (
                  <p
                    role="alert"
                    className="rounded-xl border border-wine/30 bg-wine/10 px-4 py-3 text-sm text-wine animate-fade-up motion-reduce:animate-none"
                  >
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-midnight-gradient px-6 text-sm font-medium text-primary-foreground shadow-page transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow active:scale-[0.98] disabled:opacity-70"
                >
                  {saving ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Saving your shelf…
                    </>
                  ) : (
                    <>
                      <Save className="size-4" /> Save profile
                    </>
                  )}
                </button>
              </form>
            </Reveal>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
