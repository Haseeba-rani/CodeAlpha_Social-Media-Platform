import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
  head: () => ({
    meta: [
      { title: "Notifications — NovelNest" },
      {
        name: "description",
        content: "Follows, replies and reactions from the readers around your stories on NovelNest.",
      },
      { property: "og:title", content: "Notifications — NovelNest" },
      {
        property: "og:description",
        content: "See what the readers around your stories are up to.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function NotificationsPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <Reveal>
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-wine">
            <Bell className="size-4" /> Notifications
          </p>
          <h1 className="mt-2 font-display text-4xl text-foreground sm:text-5xl">
            All quiet in the margins
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            When readers follow you, reply to your thoughts or love a review you wrote, you'll find
            it gathered here.
          </p>
        </Reveal>

        <div className="mt-8 space-y-3">
          {[0, 1, 2].map((i) => (
            <Reveal key={i} delay={i * 90}>
              <div className="flex items-center gap-4 rounded-2xl border border-dashed border-border bg-card/60 p-5">
                <span className="size-10 rounded-full bg-primary/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 rounded bg-primary/10" />
                  <div className="h-3 w-2/3 rounded bg-primary/5" />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
