import { formatStatus } from "@/lib/format";
import { Badge } from "../ui/badge";
import { statusTone } from "./status-utils";

export function PageStatusBadge({ status }: { status?: string | null }) {
  return <Badge tone={statusTone(status)}>{formatStatus(status)}</Badge>;
}
