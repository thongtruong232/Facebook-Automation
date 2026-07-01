"use client";

export function confirmAction(title: string, message: string) {
  return window.confirm(`${title}\n\n${message}`);
}
