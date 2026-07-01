const toneByStatus: Record<string, string> = {
  DRAFT: "badge-gray",
  READY: "badge-blue",
  QUEUED: "badge-blue",
  PENDING: "badge-blue",
  RUNNING: "badge-amber",
  PROCESSING: "badge-amber",
  SUCCESS: "badge-green",
  PUBLISHED: "badge-green",
  ACTIVE: "badge-green",
  FAILED: "badge-red",
  CANCELLED: "badge-gray",
  DISABLED: "badge-gray"
};

export function StatusBadge({ status }: { status?: string | null }) {
  const value = status ?? "UNKNOWN";
  return <span className={`badge ${toneByStatus[value] ?? "badge-gray"}`}>{value}</span>;
}
