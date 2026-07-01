import { formatStatus } from "@/lib/format";
import { Badge } from "../ui/badge";
import { statusTone } from "./status-utils";

export function LogLevelBadge({ level }: { level?: string | null }) {
  return <Badge tone={statusTone(level)}>{formatStatus(level)}</Badge>;
}
