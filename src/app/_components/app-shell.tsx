import { AdminShell } from "@/components/layout/admin-shell";
import { env } from "@/server/env";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminShell appEnv={env.APP_ENV} dryRun={env.DRY_RUN}>
      {children}
    </AdminShell>
  );
}
