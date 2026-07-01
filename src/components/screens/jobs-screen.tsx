"use client";

import { Eye, RotateCcw, XCircle } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type { JobItem } from "@/lib/admin-types";
import { apiGet, apiPost } from "@/lib/client-api";
import { formatDate, truncate } from "@/lib/format";
import { JobStatusBadge } from "../status/job-status-badge";
import { Button, ButtonLink } from "../ui/button";
import { confirmAction } from "../ui/confirm-dialog";
import { EmptyState } from "../ui/empty-state";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { DataTable, TableWrap } from "../ui/table";
import { ToastViewport, useToast } from "../ui/toast";

const jobStatuses = ["", "PENDING", "RUNNING", "SUCCESS", "FAILED", "CANCELLED"];
const jobTypes = ["", "PUBLISH_REEL"];

export function JobsScreen({ initialJobs }: { initialJobs: JobItem[] }) {
  const [jobs, setJobs] = useState(initialJobs);
  const [status, setStatus] = useState("");
  const [jobType, setJobType] = useState("");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const { toast, showToast, clearToast } = useToast();

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesStatus = !status || job.status === status;
      const matchesType = !jobType || job.jobType === jobType;
      const matchesSearch = !query || job.socialPost.caption.toLowerCase().includes(query);
      return matchesStatus && matchesType && matchesSearch;
    });
  }, [jobType, jobs, search, status]);

  const refresh = useCallback(async () => {
    setJobs(await apiGet<JobItem[]>("/api/jobs"));
  }, []);

  async function retryJob(job: JobItem) {
    if (!confirmAction("Retry failed job?", "The worker will attempt this failed publish job again.")) return;
    setBusyId(job.id);
    try {
      await apiPost(`/api/jobs/${job.id}/retry`);
      showToast("Job retry queued.", "success");
      await refresh();
    } catch (retryError) {
      showToast(retryError instanceof Error ? retryError.message : "Could not retry job.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function cancelJob(job: JobItem) {
    if (!confirmAction("Cancel pending job?", "This action will cancel the pending publish job and mark the post cancelled.")) return;
    setBusyId(job.id);
    try {
      await apiPost(`/api/jobs/${job.id}/cancel`);
      showToast("Job cancelled.", "success");
      await refresh();
    } catch (cancelError) {
      showToast(cancelError instanceof Error ? cancelError.message : "Could not cancel job.", "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1 className="page-title">Publish Jobs</h1>
          <p className="page-description">Monitor background publishing jobs.</p>
        </div>
      </div>

      <div className="filter-bar">
        <Select id="job-status" label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
          {jobStatuses.map((item) => (
            <option key={item || "all"} value={item}>{item || "All statuses"}</option>
          ))}
        </Select>
        <Select id="job-type" label="Job Type" value={jobType} onChange={(event) => setJobType(event.target.value)}>
          {jobTypes.map((item) => (
            <option key={item || "all"} value={item}>{item || "All job types"}</option>
          ))}
        </Select>
        <Input
          className="field-search"
          id="job-search"
          label="Search post caption"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Caption text"
        />
      </div>

      <TableWrap>
        {filteredJobs.length ? (
          <DataTable>
            <thead>
              <tr>
                <th>Job</th>
                <th>Post</th>
                <th>Page</th>
                <th>Status</th>
                <th>Run At</th>
                <th>Started</th>
                <th>Finished</th>
                <th>Attempts</th>
                <th>Error</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => (
                <tr key={job.id}>
                  <td className="id-text" title={job.runId}>{job.runId}</td>
                  <td className="caption-preview" title={job.socialPost.caption}>{truncate(job.socialPost.caption, 80)}</td>
                  <td>{job.socialPost.facebookPage.name}</td>
                  <td><JobStatusBadge status={job.status} /></td>
                  <td>{formatDate(job.runAt)}</td>
                  <td>{formatDate(job.startedAt)}</td>
                  <td>{formatDate(job.finishedAt)}</td>
                  <td>{job.attempts}/{job.maxAttempts}</td>
                  <td className="caption-preview" title={job.errorMessage ?? ""}>{job.errorMessage ? truncate(job.errorMessage, 80) : "-"}</td>
                  <td>
                    <div className="table-actions">
                      {job.status === "FAILED" ? (
                        <Button type="button" onClick={() => void retryJob(job)} disabled={busyId === job.id}>
                          <RotateCcw size={16} aria-hidden="true" />
                          Retry
                        </Button>
                      ) : null}
                      {job.status === "PENDING" ? (
                        <Button tone="danger" type="button" onClick={() => void cancelJob(job)} disabled={busyId === job.id}>
                          <XCircle size={16} aria-hidden="true" />
                          Cancel
                        </Button>
                      ) : null}
                      <ButtonLink href={`/logs?jobId=${job.id}`}>
                        <Eye size={16} aria-hidden="true" />
                        View Logs
                      </ButtonLink>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        ) : jobs.length ? (
          <EmptyState title="No jobs match the filters." description="Clear filters or search another caption." />
        ) : (
          <EmptyState title="No publish jobs yet." description="Schedule a post to create the first pending job." />
        )}
      </TableWrap>
      <ToastViewport toast={toast} onDismiss={clearToast} />
    </div>
  );
}
