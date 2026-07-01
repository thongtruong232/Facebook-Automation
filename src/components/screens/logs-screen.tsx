"use client";

import { useMemo, useState } from "react";
import type { LogItem } from "@/lib/admin-types";
import { apiGet } from "@/lib/client-api";
import { formatDate, truncate } from "@/lib/format";
import { LogLevelBadge } from "../status/log-level-badge";
import { Button } from "../ui/button";
import { EmptyState } from "../ui/empty-state";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { DataTable, TableWrap } from "../ui/table";

const levels = ["", "DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"];
const limits = ["50", "100", "200"];

export function LogsScreen({
  initialLogs,
  initialFilters
}: {
  initialLogs: LogItem[];
  initialFilters?: { level?: string; jobId?: string; postId?: string; limit?: string };
}) {
  const [logs, setLogs] = useState(initialLogs);
  const [level, setLevel] = useState(initialFilters?.level ?? "");
  const [jobId, setJobId] = useState(initialFilters?.jobId ?? "");
  const [postId, setPostId] = useState(initialFilters?.postId ?? "");
  const [limit, setLimit] = useState(initialFilters?.limit ?? "100");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasMeta = useMemo(() => new Set(logs.filter((log) => log.metaJson).map((log) => log.id)), [logs]);

  async function applyFilters() {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (level) params.set("level", level);
    if (jobId.trim()) params.set("jobId", jobId.trim());
    if (postId.trim()) params.set("socialPostId", postId.trim());
    if (limit) params.set("limit", limit);

    try {
      const query = params.toString();
      setLogs(await apiGet<LogItem[]>(query ? `/api/logs?${query}` : "/api/logs"));
    } catch (filterError) {
      setError(filterError instanceof Error ? filterError.message : "Could not load logs.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1 className="page-title">Logs</h1>
          <p className="page-description">Read worker and job logs without exposing secrets.</p>
        </div>
      </div>

      <div className="filter-bar">
        <Select id="log-level" label="Level" value={level} onChange={(event) => setLevel(event.target.value)}>
          {levels.map((item) => (
            <option key={item || "all"} value={item}>{item || "All levels"}</option>
          ))}
        </Select>
        <Input id="job-id" label="Job ID" value={jobId} onChange={(event) => setJobId(event.target.value)} placeholder="PublishJob UUID" />
        <Input id="post-id" label="Post ID" value={postId} onChange={(event) => setPostId(event.target.value)} placeholder="SocialPost UUID" />
        <Select id="log-limit" label="Limit" value={limit} onChange={(event) => setLimit(event.target.value)}>
          {limits.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </Select>
        <Button type="button" onClick={() => void applyFilters()} disabled={loading}>
          {loading ? "Loading..." : "Apply"}
        </Button>
      </div>

      {error ? <div className="error-note">{error}</div> : null}

      <TableWrap>
        {logs.length ? (
          <DataTable>
            <thead>
              <tr>
                <th>Time</th>
                <th>Level</th>
                <th>Step</th>
                <th>Message</th>
                <th>Job ID</th>
                <th>Post ID</th>
                <th>Meta</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{formatDate(log.createdAt)}</td>
                  <td><LogLevelBadge level={log.level} /></td>
                  <td>{log.step}</td>
                  <td className="caption-preview" title={log.message}>{truncate(log.message, 100)}</td>
                  <td className="id-text" title={log.jobId ?? ""}>{log.job?.runId ?? log.jobId ?? "-"}</td>
                  <td className="id-text" title={log.socialPostId ?? ""}>{log.socialPostId ?? "-"}</td>
                  <td>
                    {hasMeta.has(log.id) ? (
                      <>
                        <Button type="button" onClick={() => setExpandedId((current) => (current === log.id ? null : log.id))}>
                          View
                        </Button>
                        {expandedId === log.id ? <pre className="meta-pre">{JSON.stringify(log.metaJson, null, 2)}</pre> : null}
                      </>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        ) : (
          <EmptyState title="No logs found." description="Run the worker or create a scheduled post to generate logs." />
        )}
      </TableWrap>
    </div>
  );
}
