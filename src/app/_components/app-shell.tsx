import Link from "next/link";
import {
  BarChart3,
  BriefcaseBusiness,
  Clapperboard,
  FileText,
  GalleryVerticalEnd,
  ListChecks,
  Settings,
  Users
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/posts", label: "Posts / Reels", icon: Clapperboard },
  { href: "/media", label: "Media Library", icon: GalleryVerticalEnd },
  { href: "/pages", label: "Facebook Pages", icon: BriefcaseBusiness },
  { href: "/jobs", label: "Jobs", icon: ListChecks },
  { href: "/logs", label: "Logs", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/users", label: "Users", icon: Users }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">F</span>
          <span>Reels Automation</span>
        </div>
        <nav className="nav" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link className="nav-link" href={item.href} key={item.href}>
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
