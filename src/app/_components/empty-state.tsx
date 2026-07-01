import { EmptyState as SharedEmptyState } from "@/components/ui/empty-state";

export function EmptyState({ label }: { label: string }) {
  return <SharedEmptyState title={label} />;
}
