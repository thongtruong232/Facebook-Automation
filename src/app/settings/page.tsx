import { StatusBadge } from "../_components/status-badge";
import { env } from "@/server/env";

export default function SettingsPage() {
  const settings = [
    ["APP_ENV", env.APP_ENV],
    ["DRY_RUN", String(env.DRY_RUN)],
    ["META_GRAPH_VERSION", env.META_GRAPH_VERSION],
    ["UPLOAD_DIR", env.UPLOAD_DIR],
    ["DEFAULT_TIMEZONE", env.DEFAULT_TIMEZONE],
    ["MAX_POSTS_PER_RUN", String(env.MAX_POSTS_PER_RUN)],
    ["MAX_RETRY", String(env.MAX_RETRY)]
  ];

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <StatusBadge status={env.DRY_RUN ? "READY" : "RUNNING"} />
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Key</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {settings.map(([key, value]) => (
              <tr key={key}>
                <td>{key}</td>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
