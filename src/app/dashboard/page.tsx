import { RefreshCcw } from "lucide-react";
import { EmptyState } from "../_components/empty-state";
import { StatusBadge } from "../_components/status-badge";
import { formatDateTime } from "@/lib/time";
import { getDashboardSummary } from "@/server/services/dashboard.service";

export const dynamic = "force-dynamic";

async function loadDashboard() {
  try {
    return { data: await getDashboardSummary(), error: null };
  } catch (error) {
    return {
      data: {
        scheduledToday: 0,
        publishedToday: 0,
        failedToday: 0,
        pendingJobs: 0,
        lastSuccessfulPublish: null,
        lastFailedPublish: null,
        upcomingPosts: [],
        recentFailedJobs: []
      },
      error: error instanceof Error ? error.message : "Database is not available."
    };
  }
}

export default async function DashboardPage() {
  const { data, error } = await loadDashboard();
  const stats = [
    ["Scheduled today", data.scheduledToday],
    ["Published today", data.publishedToday],
    ["Failed today", data.failedToday],
    ["Pending jobs", data.pendingJobs]
  ];

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <a className="button" href="/dashboard">
          <RefreshCcw size={16} aria-hidden="true" />
          Refresh
        </a>
      </div>

      {error ? <div className="error-note">{error}</div> : null}

      <section className="stats-grid">
        {stats.map(([label, value]) => (
          <div className="stat-card" key={label}>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{value}</div>
          </div>
        ))}
      </section>

      <section className="split">
        <div className="panel">
          <h2 className="panel-title">Upcoming Posts</h2>
          {data.upcomingPosts.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Caption</th>
                    <th>Page</th>
                    <th>Scheduled At</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.upcomingPosts.map((post) => (
                    <tr key={post.id}>
                      <td className="caption-preview">{post.caption}</td>
                      <td>{post.facebookPage.name}</td>
                      <td>{formatDateTime(post.scheduledAt)}</td>
                      <td>
                        <StatusBadge status={post.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState label="No upcoming posts" />
          )}
        </div>

        <div className="grid">
          <div className="panel">
            <h2 className="panel-title">Last Successful Publish</h2>
            {data.lastSuccessfulPublish ? (
              <p>
                {data.lastSuccessfulPublish.facebookPage.name}
                <br />
                <span className="muted">{formatDateTime(data.lastSuccessfulPublish.publishedAt)}</span>
              </p>
            ) : (
              <EmptyState label="No successful publish yet" />
            )}
          </div>
          <div className="panel">
            <h2 className="panel-title">Last Failed Publish</h2>
            {data.lastFailedPublish ? (
              <p>
                {data.lastFailedPublish.facebookPage.name}
                <br />
                <span className="muted">{data.lastFailedPublish.lastError ?? "Unknown error"}</span>
              </p>
            ) : (
              <EmptyState label="No failed publish yet" />
            )}
          </div>
        </div>
      </section>
    </>
  );
}
