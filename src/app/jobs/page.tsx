import { RotateCcw, XCircle } from "lucide-react";
import { EmptyState } from "../_components/empty-state";
import { StatusBadge } from "../_components/status-badge";
import { formatDateTime } from "@/lib/time";
import { listJobs } from "@/server/services/job.service";

export const dynamic = "force-dynamic";

async function loadJobs() {
  try {
    return { jobs: await listJobs(), error: null };
  } catch (error) {
    return { jobs: [], error: error instanceof Error ? error.message : "Database is not available." };
  }
}

export default async function JobsPage() {
  const { jobs, error } = await loadJobs();

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Jobs</h1>
      </div>
      {error ? <div className="error-note">{error}</div> : null}
      <div className="table-wrap">
        {jobs.length ? (
          <table>
            <thead>
              <tr>
                <th>Run ID</th>
                <th>Post</th>
                <th>Page</th>
                <th>Status</th>
                <th>Run At</th>
                <th>Attempts</th>
                <th>Error</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>{job.runId}</td>
                  <td className="caption-preview">{job.socialPost.caption}</td>
                  <td>{job.socialPost.facebookPage.name}</td>
                  <td>
                    <StatusBadge status={job.status} />
                  </td>
                  <td>{formatDateTime(job.runAt)}</td>
                  <td>
                    {job.attempts}/{job.maxAttempts}
                  </td>
                  <td className="caption-preview">{job.errorMessage ?? "-"}</td>
                  <td>
                    <div className="button-row">
                      <form action={`/api/jobs/${job.id}/retry`} method="post">
                        <button className="button" type="submit">
                          <RotateCcw size={16} aria-hidden="true" />
                          Retry
                        </button>
                      </form>
                      <form action={`/api/jobs/${job.id}/cancel`} method="post">
                        <button className="button button-danger" type="submit">
                          <XCircle size={16} aria-hidden="true" />
                          Cancel
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState label="No jobs" />
        )}
      </div>
    </>
  );
}
