import { Plus } from "lucide-react";
import { Badge } from "../ui/badge";
import { ButtonLink } from "../ui/button";

export function Topbar({ appEnv, dryRun }: { appEnv: string; dryRun: boolean }) {
  return (
    <header className="topbar">
      <div>
        <div className="topbar-title">Facebook Reels Automation</div>
        <div className="topbar-subtitle">Admin console for Page/Reels scheduling</div>
      </div>
      <div className="topbar-actions">
        <Badge tone={dryRun ? "amber" : "green"}>{dryRun ? "DRY RUN" : appEnv.toUpperCase()}</Badge>
        <ButtonLink href="/posts/new" tone="primary">
          <Plus size={16} aria-hidden="true" />
          Create Post
        </ButtonLink>
      </div>
    </header>
  );
}
