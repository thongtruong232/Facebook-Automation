export function formatDate(value?: string | Date | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}

export function formatBytes(value: number | string | bigint): string {
  const bytes = typeof value === "bigint" ? Number(value) : Number(value);
  if (!Number.isFinite(bytes) || bytes <= 0) return "-";

  const units = ["bytes", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const formatted = Number.isInteger(size) ? String(size) : size.toFixed(1);
  return `${formatted} ${units[unitIndex]}`;
}

export function truncate(value: string, length = 80): string {
  if (value.length <= length) return value;
  const sliced = value.slice(0, Math.max(0, length)).trimEnd();
  const lastSpace = sliced.lastIndexOf(" ");
  const prefix = lastSpace > 0 ? sliced.slice(0, lastSpace) : sliced;
  return `${prefix}...`;
}
