"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { EmptyState } from "../_components/empty-state";
import { StatusBadge } from "../_components/status-badge";
import { apiGet } from "@/lib/client-api";
import { formatDate, truncate } from "@/lib/format";

type DashboardSummary = {
  scheduledToday: number;
  publishedToday: number;
  failedToday: number;
  pendingJobs: number;
  runningJobs: number;
  totalPages: number;
  totalMedia: number;
  lastSuccessfulPublish: { publishedAt: string | null; facebookPage: { name: string } } | null;
  lastFailedPublish: { lastError: string | null; facebookPage: { name: string } } | null;
  upcomingPosts: Array<{
    id: string;
    caption: string;
    scheduledAt: string;
    status: string;
    facebookPage: { name: string };
  }>;
  recentFailedJobs: Array<{
    id: string;
    runId: string;
    errorMessage: string | null;
    socialPost: { caption: string };
  }>;
};

const emptyDashboard: DashboardSummary = {
  scheduledToday: 0,
  publishedToday: 0,
  failedToday: 0,
  pendingJobs: 0,
  runningJobs: 0,
  totalPages: 0,
  totalMedia: 0,
  lastSuccessfulPublish: null,
  lastFailedPublish: null,
  upcomingPosts: [],
  recentFailedJobs: []
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary>(emptyDashboard);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await apiGet<DashboardSummary>("/api/dashboard"));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Dashboard is not available.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const stats = [
    ["Scheduled today", data.scheduledToday],
    ["Published today", data.publishedToday],
    ["Failed today", data.failedToday],
    ["Pending jobs", data.pendingJobs],
    ["Running jobs", data.runningJobs],
    ["Total pages", data.totalPages],
    ["Total media", data.totalMedia]
  ];

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <button className="button" type="button" onClick={loadDashboard} disabled={loading}>
          <RefreshCcw size={16} aria-hidden="true" />
          Refresh
        </button>
      </div>

      {error ? <div className="error-note">{error}</div> : null}
      {loading ? <div className="empty">Loading dashboard...</div> : null}

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
                      <td>{truncate(post.caption, 72)}</td>
                      <td>{post.facebookPage.name}</td>
                      <td>{formatDate(post.scheduledAt)}</td>
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
                <span className="muted">{formatDate(data.lastSuccessfulPublish.publishedAt)}</span>
              </p>
            ) : (
              <EmptyState label="No successful publish yet" />
            )}
          </div>
          <div className="panel">
            <h2 className="panel-title">Recent Failed Jobs</h2>
            {data.recentFailedJobs.length ? (
              <div className="grid">
                {data.recentFailedJobs.map((job) => (
                  <div key={job.id}>
                    <strong>{truncate(job.socialPost.caption, 48)}</strong>
                    <br />
                    <span className="muted">{job.errorMessage ?? job.runId}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState label="No failed jobs" />
            )}
          </div>
        </div>
      </section>
    </>
  );
}
