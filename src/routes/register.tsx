import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ParticleField } from "@/components/ParticleField";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
  head: () => ({
    meta: [
      { title: "Join NovelNest — Create your reader account" },
      {
        name: "description",
        content:
          "Create your NovelNest account to track novels, post thoughts and find readers who love the same stories.",
      },
      { property: "og:title", content: "Join NovelNest" },
      {
        property: "og:description",
        content: "Create your reader account and enter a world of stories and connections.",
      },
    ],
  }),
});

const inputClass =
  "w-full rounded-xl border border-gold/30 bg-background/10 px-4 py-3 text-sm text-primary-foreground placeholder:text-primary-foreground/60 outline-none backdrop-blur transition-all duration-300 focus:border-gold focus:shadow-glow";

function RegisterPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  useEffect(() => {
    if (!loading && session && !submitting) navigate({ to: "/reading-room", replace: true });
  }, [loading, session, submitting, navigate]);

  const validate = () => {
    if (!password) return "Please enter a password.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
    if (!fullName.trim() || !username.trim() || !email.trim())
      return "Every field helps us bind your shelf — please fill them all in.";
    if (fullName.trim().length > 100) return "Please keep your name under 100 characters.";
    if (!/^[a-zA-Z0-9._]{3,30}$/.test(username.trim()))
      return "Usernames use 3–30 letters, numbers, dots or underscores.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return "That email address doesn't look quite right.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: { full_name: fullName.trim(), username: username.trim() },
      },
    });

    if (signUpError) {
      console.error("[NovelNest signup] Auth account creation failed", signUpError);
      setSubmitting(false);
      const msg = friendlyAuthError(signUpError.message);
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!data.session) {
      setSubmitting(false);
      setCheckEmail(true);
      toast.success("Almost there — confirm your email to open your shelf.");
      return;
    }

    // The profile row is created automatically with the account; make sure it exists.
    if (!data.user) {
      console.error("[NovelNest signup] Auth returned no user and no error");
      setSubmitting(false);
      const msg = "We couldn't create your account. Please try again.";
      setError(msg);
      toast.error(msg);
      return;
    }

    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, username, email")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError || !profileRow) {
      console.error("[NovelNest signup] Profile verification failed", profileError);
      setSubmitting(false);
      const msg = "We couldn't finish creating your reader profile. Please try again.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setSubmitting(false);
    toast.success("Your shelf is ready. Welcome to NovelNest.");
    navigate({ to: "/reading-room", replace: true });
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="relative overflow-hidden bg-midnight-gradient py-24 text-primary-foreground">
        <ParticleField count={14} seed={5} />
        <div className="relative mx-auto max-w-md px-5">
          <h1 className="font-display text-5xl animate-fade-up motion-reduce:animate-none">
            Join NovelNest
          </h1>
          <p
            className="mt-2 text-sm opacity-85 animate-fade-up motion-reduce:animate-none"
            style={{ animationDelay: "120ms" }}
          >
            A social world built for novel readers.
          </p>

          {checkEmail ? (
            <div
              className="mt-8 rounded-2xl border border-gold/30 bg-background/10 p-6 backdrop-blur animate-fade-up motion-reduce:animate-none"
              role="status"
            >
              <MailCheck className="size-6 text-gold" />
              <h2 className="mt-3 font-display text-2xl">Check your inbox</h2>
              <p className="mt-2 text-sm opacity-85">
                We sent a confirmation link to <span className="text-gold">{email}</span>. Open it
                and your reading world will be waiting.
              </p>
              <Link
                to="/login"
                className="mt-5 inline-flex h-10 items-center rounded-xl bg-gold px-5 text-sm font-medium text-gold-foreground transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow"
              >
                Go to log in
              </Link>
            </div>
          ) : (
            <form
              className="mt-8 space-y-4 animate-fade-up motion-reduce:animate-none"
              style={{ animationDelay: "220ms" }}
              onSubmit={handleSubmit}
              noValidate
            >
              <input
                placeholder="Full name"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
              />
              <input
                placeholder="Username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inputClass}
              />
              <input
                type="email"
                placeholder="Email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
              <input
                type="password"
                placeholder="Password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
              <input
                type="password"
                placeholder="Confirm password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
              />

              {error ? (
                <p
                  role="alert"
                  className="rounded-xl border border-gold/40 bg-background/20 px-4 py-3 text-sm text-gold animate-fade-up motion-reduce:animate-none"
                >
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gold px-6 text-sm font-medium text-gold-foreground shadow-page transition-all duration-300 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-glow active:scale-[0.98] disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Binding your shelf…
                  </>
                ) : (
                  "Create my shelf"
                )}
              </button>
            </form>
          )}

          <p
            className="mt-6 text-sm opacity-85 animate-fade-up motion-reduce:animate-none"
            style={{ animationDelay: "320ms" }}
          >
            Already a reader?{" "}
            <Link to="/login" className="text-gold transition-colors hover:brightness-110">
              Log in
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
