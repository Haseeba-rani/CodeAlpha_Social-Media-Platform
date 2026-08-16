import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-motion";

type TypewriterProps = {
  text: string;
  /** ms before typing starts */
  startDelay?: number;
  /** average ms per character */
  speed?: number;
  className?: string;
};

function Caret({ blinking }: { blinking: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={
        "ml-[0.06em] inline-block h-[0.85em] w-[0.06em] translate-y-[0.08em] bg-gold align-baseline motion-reduce:hidden " +
        (blinking ? "animate-caret-blink" : "opacity-90")
      }
    />
  );
}

/** Splits typed text so the caret can never wrap onto its own line. */
function TypedLine({ typed, blinking }: { typed: string; blinking: boolean }) {
  const lastSpace = typed.lastIndexOf(" ");
  const head = lastSpace >= 0 ? typed.slice(0, lastSpace + 1) : "";
  const tail = lastSpace >= 0 ? typed.slice(lastSpace + 1) : typed;
  return (
    <>
      <span className="text-gradient-gold">{head}</span>
      <span className="inline-block whitespace-nowrap">
        <span className="text-gradient-gold">{tail}</span>
        <Caret blinking={blinking} />
      </span>
    </>
  );
}

/** Types text out character by character with a blinking ink caret. Restarts on every mount. */
export function Typewriter({ text, startDelay = 500, speed = 45, className }: TypewriterProps) {
  const reduced = usePrefersReducedMotion();
  const [count, setCount] = useState(0);
  const done = count >= text.length;

  useEffect(() => {
    if (reduced) {
      setCount(text.length);
      return;
    }
    setCount(0);
    let timer: number;
    let cancelled = false;

    const typeNext = (i: number) => {
      if (cancelled) return;
      setCount(i);
      if (i >= text.length) return;
      const char = text[i];
      // pause a beat longer after punctuation and spaces, like a real hand
      const jitter = speed * (0.7 + Math.random() * 0.6);
      const pause = char === "," ? 220 : char === "." ? 280 : char === " " ? speed * 1.3 : jitter;
      timer = window.setTimeout(() => typeNext(i + 1), pause);
    };

    timer = window.setTimeout(() => typeNext(1), startDelay);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [text, speed, startDelay, reduced]);

  return (
    <span className={className}>
      {/* invisible full text reserves the final space so nothing jumps */}
      <span className="relative inline-block">
        <span aria-hidden="true" className="invisible">
          <TypedLine typed={text} blinking={false} />
        </span>
        <span className="absolute inset-0" aria-label={text} role="text">
          <TypedLine typed={text.slice(0, count)} blinking={done} />
        </span>
      </span>
    </span>
  );
}
