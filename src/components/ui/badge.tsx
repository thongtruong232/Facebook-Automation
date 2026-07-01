import type { HTMLAttributes } from "react";

export type BadgeTone = "gray" | "blue" | "green" | "amber" | "red" | "dark-red";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

export function Badge({ className, tone = "gray", ...props }: BadgeProps) {
  return <span className={["badge", `badge-${tone}`, className].filter(Boolean).join(" ")} {...props} />;
}
