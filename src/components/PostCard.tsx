import { BookOpen, Heart, MessageCircle, MoreHorizontal, Send } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const mockComments = [
  { name: "Sara Malik", initials: "SM", text: "The last three chapters undid me too." },
  { name: "Ali Raza", initials: "AR", text: "Part two changes everything, keep going." },
  { name: "Hamza Sheikh", initials: "HS", text: "Reading it again this winter." },
];

export function PostCard() {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(24);
  const [pop, setPop] = useState(false);
  const [openComments, setOpenComments] = useState(false);

  const toggleLike = () => {
    setLiked((prev) => {
      setLikes((n) => n + (prev ? -1 : 1));
      return !prev;
    });
    setPop(true);
    window.setTimeout(() => setPop(false), 450);
  };

  return (
    <article className="group rounded-2xl border border-border bg-card p-5 shadow-page transition-all duration-500 hover:-translate-y-1 hover:border-gold/50 hover:shadow-lift">
      <header className="flex items-start gap-3">
        <span
          role="img"
          aria-label="Ayesha Khan"
          className="inline-flex size-11 shrink-0 select-none items-center justify-center rounded-full bg-midnight-gradient font-display text-sm font-semibold tracking-wide text-primary-foreground ring-2 ring-gold/25 transition-transform duration-500 group-hover:scale-105"
        >
          AK
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2">
            <span className="font-display text-xl text-foreground transition-colors duration-300 group-hover:text-wine">
              Ayesha Khan
            </span>
            <span className="text-xs text-muted-foreground">@ayesha_reads · 2h</span>
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <BookOpen className="size-3.5" />
            <span className="font-medium text-foreground/80">Currently reading:</span>
            Peer-e-Kamil
          </p>
        </div>
        <span className="hidden rounded-full border border-transparent bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground transition-colors sm:inline-flex">
          Thought
        </span>
      </header>

      <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-foreground/90">
        Just reached the final chapters and I honestly don't know how to process this story.
        Everything I assumed about Salar in part one has been quietly dismantled.
      </p>

      <footer className="mt-4 flex items-center gap-1 border-t border-border pt-3">
        <button
          type="button"
          aria-pressed={liked}
          aria-label="Like this post"
          onClick={toggleLike}
          className={cn(
            "inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-300 hover:bg-wine/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            liked ? "text-wine" : "text-muted-foreground hover:text-wine",
          )}
        >
          <Heart
            className={cn("size-4 transition-colors", pop && "animate-pop")}
            fill={liked ? "currentColor" : "none"}
          />
          <span className="tabular-nums">{likes}</span>
          <span className="hidden sm:inline">Likes</span>
        </button>

        <button
          type="button"
          onClick={() => setOpenComments((o) => !o)}
          aria-expanded={openComments}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MessageCircle
            className={cn(
              "size-4 transition-transform duration-300",
              openComments && "-rotate-12 text-wine",
            )}
          />
          <span className="tabular-nums">{mockComments.length}</span>
          <span className="hidden sm:inline">Comments</span>
        </button>

        <button
          type="button"
          aria-label="More post options"
          className="ml-auto inline-flex size-9 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-all duration-300 hover:bg-accent hover:text-accent-foreground"
        >
          <MoreHorizontal className="size-4" />
        </button>
      </footer>

      <div
        className={cn(
          "grid transition-all duration-500 ease-out motion-reduce:transition-none",
          openComments ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <ul className="mt-3 space-y-3 border-t border-border pt-3">
            {mockComments.map((c, i) => (
              <li
                key={c.name}
                className="flex gap-2.5 transition-all duration-500"
                style={{
                  transitionDelay: openComments ? `${i * 90}ms` : "0ms",
                  opacity: openComments ? 1 : 0,
                  transform: openComments ? "none" : "translateY(6px)",
                }}
              >
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-midnight-gradient font-display text-[11px] font-semibold text-primary-foreground">
                  {c.initials}
                </span>
                <div className="rounded-2xl rounded-tl-sm bg-secondary/60 px-3 py-2">
                  <p className="font-display text-sm text-foreground">{c.name}</p>
                  <p className="text-sm text-foreground/85">{c.text}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center gap-2">
            <input
              placeholder="Add your thought…"
              className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none transition-all duration-300 focus:border-gold focus:shadow-glow"
            />
            <button
              type="button"
              aria-label="Send comment"
              className="inline-flex size-9 items-center justify-center rounded-full bg-midnight-gradient text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow"
            >
              <Send className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
