"use client";

import { AlertTriangle, CalendarClock, CheckCircle2, Clock3, Database, FileVideo2, RefreshCcw, Timer, XCircle } from "lucide-react";
import { useCallback, useState } from "react";
import type { DashboardSummary } from "@/lib/admin-types";
import { apiGet, apiPost } from "@/lib/client-api";
import { formatDate, truncate } from "@/lib/format";
import { PostStatusBadge } from "../status/post-status-badge";
import { Button, ButtonLink } from "../ui/button";
import { Card, CardHeader, MetricCard } from "../ui/card";
import { confirmAction } from "../ui/confirm-dialog";
import { EmptyState } from "../ui/empty-state";
import { ErrorState } from "../ui/error-state";
import { DataTable, TableWrap } from "../ui/table";
import { ToastViewport, useToast } from "../ui/toast";

export function DashboardScreen({ initialData }: { initialData: DashboardSummary }) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { toast, showToast, clearToast } = useToast();

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

  async function cancelPost(postId: string) {
    if (!confirmAction("Cancel scheduled post?", "This action will cancel pending publish jobs for this post.")) return;
    setBusyId(postId);
    try {
      await apiPost(`/api/posts/${postId}/cancel`);
      showToast("Post cancelled.", "success");
      await loadDashboard();
    } catch (actionError) {
      showToast(actionError instanceof Error ? actionError.message : "Could not cancel post.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function retryJob(jobId: string) {
    if (!confirmAction("Retry failed job?", "The worker will attempt this failed publish job again.")) return;
    setBusyId(jobId);
    try {
      await apiPost(`/api/jobs/${jobId}/retry`);
      showToast("Job retry queued.", "success");
      await loadDashboard();
    } catch (actionError) {
      showToast(actionError instanceof Error ? actionError.message : "Could not retry job.", "error");
    } finally {
      setBusyId(null);
    }
  }

  const metrics = [
    { title: "Scheduled Today", value: data.scheduledToday, description: "Ready, queued or processing", icon: <CalendarClock size={18} /> },
    { title: "Published Today", value: data.publishedToday, description: "Completed by worker", icon: <CheckCircle2 size={18} /> },
    { title: "Failed Today", value: data.failedToday, description: "Needs review", icon: <AlertTriangle size={18} /> },
    { title: "Pending Jobs", value: data.pendingJobs, description: "Waiting in queue", icon: <Timer size={18} /> },
    { title: "Running Jobs", value: data.runningJobs, description: "Currently locked", icon: <Clock3 size={18} /> },
    { title: "Total Pages", value: data.totalPages, description: "Configured Pages", icon: <Database size={18} /> },
    { title: "Total Media", value: data.totalMedia, description: "Ready and archived media", icon: <FileVideo2 size={18} /> }
  ];

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">Queue health, daily publishing progress, and the next jobs that need attention.</p>
        </div>
        <Button type="button" onClick={loadDashboard} disabled={loading}>
          <RefreshCcw size={16} aria-hidden="true" />
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {error ? <ErrorState title="Could not load dashboard" message={error} /> : null}

      <section className="stats-grid">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </section>

      <section className="two-column">
        <Card>
          <CardHeader title="Upcoming Posts" description="Scheduled Reels waiting for the worker." />
          {data.upcomingPosts.length ? (
            <TableWrap>
              <DataTable>
                <thead>
                  <tr>
                    <th>Caption</th>
                    <th>Page</th>
                    <th>Scheduled At</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.upcomingPosts.map((post) => (
                    <tr key={post.id}>
                      <td className="caption-preview" title={post.caption}>{truncate(post.caption, 80)}</td>
                      <td>{post.facebookPage.name}</td>
                      <td>{formatDate(post.scheduledAt)}</td>
                      <td><PostStatusBadge status={post.status} /></td>
                      <td>
                        <div className="table-actions">
                          <ButtonLink href="/posts">View</ButtonLink>
                          <Button tone="danger" type="button" onClick={() => void cancelPost(post.id)} disabled={busyId === post.id}>
                            <XCircle size={16} aria-hidden="true" />
                            Cancel
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            </TableWrap>
          ) : (
            <EmptyState
              title="No upcoming posts."
              description="Create your first scheduled Reel."
              action={<ButtonLink href="/posts/new" tone="primary">Create Post</ButtonLink>}
            />
          )}
        </Card>

        <div className="grid">
          <Card>
            <CardHeader title="Last Successful Publish" />
            {data.lastSuccessfulPublish ? (
              <p>
                <strong>{data.lastSuccessfulPublish.facebookPage.name}</strong>
                <br />
                <span className="muted">{formatDate(data.lastSuccessfulPublish.publishedAt)}</span>
              </p>
            ) : (
              <EmptyState title="No successful publish yet." />
            )}
          </Card>

          <Card>
            <CardHeader title="Recent Failed Jobs" description="Retry only after checking the sanitized error." />
            {data.recentFailedJobs.length ? (
              <div className="table-wrap">
                <DataTable>
                  <thead>
                    <tr>
                      <th>Post</th>
                      <th>Page</th>
                      <th>Error</th>
                      <th>Attempts</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentFailedJobs.map((job) => (
                      <tr key={job.id}>
                        <td className="caption-preview" title={job.socialPost.caption}>{truncate(job.socialPost.caption, 72)}</td>
                        <td>{job.socialPost.facebookPage.name}</td>
                        <td className="caption-preview" title={job.errorMessage ?? ""}>{truncate(job.errorMessage ?? job.runId, 72)}</td>
                        <td>{job.attempts}/{job.maxAttempts}</td>
                        <td>
                          <div className="table-actions">
                            <Button type="button" onClick={() => void retryJob(job.id)} disabled={busyId === job.id}>
                              Retry
                            </Button>
                            <ButtonLink href={`/logs?jobId=${job.id}`}>View Logs</ButtonLink>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </DataTable>
              </div>
            ) : (
              <EmptyState title="No failed jobs." description="Everything looks healthy." />
            )}
          </Card>
        </div>
      </section>
      <ToastViewport toast={toast} onDismiss={clearToast} />
    </div>
  );
}
