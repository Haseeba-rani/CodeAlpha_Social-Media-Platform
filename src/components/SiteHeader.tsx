import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, Loader2, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

const navLinkClass =
  "relative inline-flex h-8 items-center rounded-md px-3 text-xs font-medium text-foreground/80 transition-all duration-300 hover:text-wine after:absolute after:bottom-1 after:left-3 after:right-3 after:h-px after:origin-right after:scale-x-0 after:bg-gold after:transition-transform after:duration-300 hover:after:origin-left hover:after:scale-x-100";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { session, profile, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await queryClient.cancelQueries();
    queryClient.clear();
    const { error } = await supabase.auth.signOut();
    setSigningOut(false);
    if (error) {
      toast.error("We couldn't close your reading session. Please try again.");
      return;
    }
    toast.success("Signed out. Your shelves will be here when you return.");
    navigate({ to: "/login", replace: true });
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-500",
        scrolled
          ? "border-b border-border/70 bg-background/80 shadow-page backdrop-blur-md"
          : "border-b border-transparent bg-background/40 backdrop-blur-sm",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3.5">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-midnight-gradient text-primary-foreground transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105">
            <BookOpen className="size-4" />
          </span>
          <span className="font-display text-2xl text-foreground">NovelNest</span>
        </Link>

        <nav className="ml-auto flex items-center gap-1 sm:gap-2">
          {loading ? (
            <span className="h-8 w-40 animate-pulse rounded-md bg-primary/10" />
          ) : session ? (
            <>
              <Link to="/reading-room" className={cn(navLinkClass, "hidden sm:inline-flex")}>
                Reading Room
              </Link>
              <Link to="/novels" className={cn(navLinkClass, "hidden md:inline-flex")}>
                Novels
              </Link>
              <Link to="/readers" className={cn(navLinkClass, "hidden md:inline-flex")}>
                Readers
              </Link>
              <Link to="/notifications" className={cn(navLinkClass, "hidden lg:inline-flex")}>
                Notifications
              </Link>
              <Link
                to="/profile"
                className="inline-flex h-8 items-center gap-2 rounded-md border border-gold/50 px-3 text-xs font-medium transition-all duration-300 hover:border-gold hover:bg-gold/15"
              >
                <span className="flex size-5 items-center justify-center rounded-full bg-midnight-gradient text-[10px] font-semibold text-primary-foreground">
                  {(profile?.full_name || profile?.username || "R").slice(0, 1).toUpperCase()}
                </span>
                Profile
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-3 text-xs font-medium text-foreground/70 transition-all duration-300 hover:text-wine disabled:opacity-60"
              >
                {signingOut ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <LogOut className="size-3.5" />
                )}
                Logout
              </button>
            </>
          ) : (
            <>
              <a
                href="#discover"
                onClick={scrollTo("discover")}
                className={cn(navLinkClass, "hidden sm:inline-flex")}
              >
                Explore Stories
              </a>
              <Link to="/login" className={navLinkClass}>
                Log in
              </Link>
              <Link
                to="/register"
                className="inline-flex h-8 items-center justify-center rounded-md bg-midnight-gradient px-3 text-xs font-medium text-primary-foreground shadow-page transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow hover:brightness-110 active:scale-[0.97]"
              >
                Join NovelNest
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
