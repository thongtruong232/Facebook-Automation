"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BriefcaseBusiness,
  Clapperboard,
  FilePlus2,
  FileText,
  GalleryVerticalEnd,
  ListChecks,
  Settings
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/posts", label: "Posts", icon: Clapperboard },
  { href: "/posts/new", label: "Create Post", icon: FilePlus2 },
  { href: "/media", label: "Media Library", icon: GalleryVerticalEnd },
  { href: "/pages", label: "Facebook Pages", icon: BriefcaseBusiness },
  { href: "/jobs", label: "Jobs", icon: ListChecks },
  { href: "/logs", label: "Logs", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <Link className="brand" href="/dashboard">
        <span className="brand-mark">F</span>
        <span>
          <span>Facebook Reels</span>
          <small>Automation</small>
        </span>
      </Link>
      <nav className="nav" aria-label="Main navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
          return (
            <Link className={["nav-link", active ? "nav-link-active" : null].filter(Boolean).join(" ")} href={item.href} key={item.href}>
              <Icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
