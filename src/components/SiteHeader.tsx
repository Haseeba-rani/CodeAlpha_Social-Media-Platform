import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BookOpen, Loader2, LogOut, Menu, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { getUnreadNotificationsCount } from "@/lib/notifications";

const navLinkClass =
  "relative inline-flex h-8 items-center rounded-md px-3 text-xs font-medium text-foreground/80 transition-all duration-300 hover:text-wine after:absolute after:bottom-1 after:left-3 after:right-3 after:h-px after:origin-right after:scale-x-0 after:bg-gold after:transition-transform after:duration-300 hover:after:origin-left hover:after:scale-x-100";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { session, profile, loading, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Query unread notifications count for badge
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-notifications", user?.id],
    queryFn: () => (user ? getUnreadNotificationsCount(user.id) : 0),
    enabled: !!user,
    refetchInterval: 20000,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    setMobileMenuOpen(false);
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
        scrolled || mobileMenuOpen
          ? "border-b border-border/70 bg-background/90 shadow-page backdrop-blur-md"
          : "border-b border-transparent bg-background/40 backdrop-blur-sm",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3.5">
        <Link
          to="/"
          onClick={() => setMobileMenuOpen(false)}
          className="group flex items-center gap-2.5"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-midnight-gradient text-primary-foreground transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105">
            <BookOpen className="size-4" />
          </span>
          <span className="font-display text-2xl text-foreground">NovelNest</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="ml-auto hidden items-center gap-1 sm:flex sm:gap-2">
          {/* Global Search Icon Button */}
          <Link
            to="/search"
            search={{ q: "", tab: "all" }}
            aria-label="Search novels and readers"
            className="inline-flex size-8 items-center justify-center rounded-md text-foreground/80 transition-all duration-300 hover:bg-secondary hover:text-wine"
          >
            <Search className="size-4" />
          </Link>

          {loading ? (
            <span className="h-8 w-40 animate-pulse rounded-md bg-primary/10" />
          ) : session ? (
            <>
              <Link to="/reading-room" className={navLinkClass}>
                Reading Room
              </Link>
              <Link to="/novels" className={navLinkClass}>
                Novels
              </Link>
              <Link to="/readers" className={navLinkClass}>
                Readers
              </Link>

              {/* Notifications with Live Badge */}
              <Link
                to="/notifications"
                className={cn(
                  navLinkClass,
                  "inline-flex items-center gap-1.5",
                  unreadCount > 0 && "text-gold font-semibold"
                )}
                aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
              >
                <span className="relative flex items-center">
                  <Bell className="size-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex min-w-4 h-4 items-center justify-center rounded-full bg-gold px-1 font-display text-[9px] font-bold text-gold-foreground shadow-glow animate-pop">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </span>
                <span className="hidden lg:inline">Notifications</span>
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
                className={navLinkClass}
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

        {/* Mobile Action Buttons & Hamburger */}
        <div className="ml-auto flex items-center gap-1 sm:hidden">
          <Link
            to="/search"
            search={{ q: "", tab: "all" }}
            aria-label="Search novels and readers"
            className="inline-flex size-9 items-center justify-center rounded-lg text-foreground/80 transition-all hover:bg-secondary"
          >
            <Search className="size-4" />
          </Link>

          {session && (
            <Link
              to="/notifications"
              className="relative inline-flex size-9 items-center justify-center rounded-lg text-foreground/80 transition-all hover:bg-secondary"
              aria-label="Notifications"
            >
              <Bell className="size-4" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex size-2 rounded-full bg-gold shadow-glow" />
              )}
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label="Toggle navigation menu"
            className="inline-flex size-9 items-center justify-center rounded-lg text-foreground transition-all hover:bg-secondary"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="border-t border-border/60 bg-background/95 px-5 py-4 shadow-xl backdrop-blur-xl sm:hidden animate-fade-up">
          <nav className="flex flex-col space-y-2">
            {session ? (
              <>
                <Link
                  to="/reading-room"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
                >
                  <BookOpen className="size-4 text-gold" /> Reading Room
                </Link>
                <Link
                  to="/novels"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
                >
                  <BookOpen className="size-4 text-gold" /> Novels Catalog
                </Link>
                <Link
                  to="/readers"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
                >
                  <BookOpen className="size-4 text-gold" /> Readers Directory
                </Link>
                <Link
                  to="/notifications"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
                >
                  <span className="flex items-center gap-2.5">
                    <Bell className="size-4 text-gold" /> Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-gold px-2 py-0.5 text-xs font-bold text-gold-foreground">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
                >
                  <span className="flex size-5 items-center justify-center rounded-full bg-midnight-gradient text-[10px] font-semibold text-primary-foreground">
                    {(profile?.full_name || profile?.username || "R").slice(0, 1).toUpperCase()}
                  </span>
                  My Profile
                </Link>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="flex w-full items-center gap-2.5 rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-wine hover:bg-wine/10"
                  >
                    {signingOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/novels"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
                >
                  <BookOpen className="size-4 text-gold" /> Explore Stories
                </Link>
                <Link
                  to="/readers"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
                >
                  <BookOpen className="size-4 text-gold" /> Readers
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center rounded-xl bg-midnight-gradient px-3 py-2.5 text-sm font-medium text-primary-foreground shadow-page hover:brightness-110"
                >
                  Join NovelNest
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
