import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Log in — NovelNest" },
      {
        name: "description",
        content: "Return to your shelves, conversations and reading soulmates on NovelNest.",
      },
      { property: "og:title", content: "Log in — NovelNest" },
      {
        property: "og:description",
        content: "Return to your shelves and reading conversations on NovelNest.",
      },
    ],
  }),
});

const inputClass =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-page outline-none transition-all duration-300 focus:border-gold focus:shadow-glow";

function LoginPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/reading-room", replace: true });
  }, [loading, session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please fill in both your email and password.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("That email address doesn't look quite right.");
      return;
    }

    setSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);

    if (signInError) {
      console.error("[NovelNest login] Password sign-in failed", signInError);
      const msg = friendlyAuthError(signInError.message);
      setError(msg);
      toast.error(msg);
      return;
    }
    toast.success("Welcome back to NovelNest.");
    navigate({ to: "/reading-room", replace: true });
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-md px-5 py-24 animate-fade-up">
        <h1 className="font-display text-5xl text-foreground">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your shelves have been waiting patiently.
        </p>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
          <input
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />

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
            disabled={submitting}
            className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-midnight-gradient px-6 text-sm font-medium text-primary-foreground shadow-page transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow active:scale-[0.98] disabled:opacity-70"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Opening your shelves…
              </>
            ) : (
              "Continue reading"
            )}
          </button>
        </form>
        <p className="mt-6 text-sm text-muted-foreground">
          New here?{" "}
          <Link to="/register" className="text-wine transition-colors hover:text-gold">
            Join NovelNest
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
