export function now(): Date {
  return new Date();
}

export function addBackoffDelay(attempt: number): Date {
  const minutes = attempt <= 1 ? 1 : attempt === 2 ? 3 : attempt === 3 ? 10 : 30;
  return new Date(now().getTime() + minutes * 60_000);
}

export function startOfDay(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function endOfDay(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
}

export function formatDateTime(value?: Date | string | null): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export function parseDateInput(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date.");
  }
  return date;
}
