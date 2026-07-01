import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type ButtonTone = "default" | "primary" | "danger" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: ButtonTone;
};

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  tone?: ButtonTone;
  children: ReactNode;
};

export function Button({ className, tone = "default", ...props }: ButtonProps) {
  return <button className={buttonClassName(tone, className)} {...props} />;
}

export function ButtonLink({ className, tone = "default", href, ...props }: ButtonLinkProps) {
  return <Link className={buttonClassName(tone, className)} href={href} {...props} />;
}

export function buttonClassName(tone: ButtonTone = "default", className?: string) {
  return ["button", tone !== "default" ? `button-${tone}` : null, className].filter(Boolean).join(" ");
}
