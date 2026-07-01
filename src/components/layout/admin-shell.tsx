import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AdminShell({
  children,
  appEnv,
  dryRun
}: {
  children: ReactNode;
  appEnv: string;
  dryRun: boolean;
}) {
  return (
    <div className="shell">
      <Sidebar />
      <div className="content-frame">
        <Topbar appEnv={appEnv} dryRun={dryRun} />
        <main className="main">{children}</main>
      </div>
    </div>
  );
}
