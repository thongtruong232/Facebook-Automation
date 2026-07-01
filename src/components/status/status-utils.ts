import type { BadgeTone } from "../ui/badge";

export function statusTone(status?: string | null): BadgeTone {
  const value = status ?? "UNKNOWN";

  if (["ACTIVE", "READY", "QUEUED", "PENDING", "INFO"].includes(value)) return "blue";
  if (["SUCCESS", "PUBLISHED"].includes(value)) return "green";
  if (["RUNNING", "PROCESSING", "WARNING"].includes(value)) return "amber";
  if (["FAILED", "TOKEN_INVALID", "ERROR"].includes(value)) return "red";
  if (["CRITICAL"].includes(value)) return "dark-red";

  return "gray";
}
