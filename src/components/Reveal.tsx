import type { ReactNode } from "react";
import { useInView } from "@/hooks/use-motion";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "section";
  variant?: "up" | "scale" | "blur";
};

export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
  variant = "up",
}: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>();

  const hidden =
    variant === "scale"
      ? "opacity-0 translate-y-3 scale-[0.96]"
      : variant === "blur"
        ? "opacity-0 translate-y-4 blur-[8px]"
        : "opacity-0 translate-y-5";

  return (
    <Tag
      ref={ref as never}
      className={cn(
        "transition-all duration-700 ease-out will-change-transform motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0 motion-reduce:blur-none",
        inView ? "opacity-100 translate-y-0 scale-100 blur-0" : hidden,
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
