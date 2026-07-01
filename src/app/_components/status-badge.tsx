import { Badge } from "@/components/ui/badge";
import { formatStatus } from "@/lib/format";
import { statusTone } from "@/components/status/status-utils";

export function StatusBadge({ status }: { status?: string | null }) {
  return <Badge tone={statusTone(status)}>{formatStatus(status)}</Badge>;
}
