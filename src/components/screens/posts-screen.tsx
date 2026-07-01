"use client";

import { CalendarPlus, Eye, RotateCcw, Search, XCircle } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type { PostItem } from "@/lib/admin-types";
import { apiGet, apiPost } from "@/lib/client-api";
import { formatDate, truncate } from "@/lib/format";
import { PostStatusBadge } from "../status/post-status-badge";
import { Button, ButtonLink } from "../ui/button";
import { confirmAction } from "../ui/confirm-dialog";
import { EmptyState } from "../ui/empty-state";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { DataTable, TableWrap } from "../ui/table";
import { ToastViewport, useToast } from "../ui/toast";

const postStatuses = ["", "DRAFT", "READY", "QUEUED", "PROCESSING", "PUBLISHED", "FAILED", "CANCELLED"];

export function PostsScreen({ initialPosts }: { initialPosts: PostItem[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [status, setStatus] = useState("");
  const [pageId, setPageId] = useState("");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const { toast, showToast, clearToast } = useToast();

  const pages = useMemo(() => {
    const map = new Map<string, string>();
    posts.forEach((post) => map.set(post.facebookPage.id, post.facebookPage.name));
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesStatus = !status || post.status === status;
      const matchesPage = !pageId || post.facebookPage.id === pageId;
      const matchesSearch = !query || post.caption.toLowerCase().includes(query);
      return matchesStatus && matchesPage && matchesSearch;
    });
  }, [pageId, posts, search, status]);

  const refresh = useCallback(async () => {
    setPosts(await apiGet<PostItem[]>("/api/posts"));
  }, []);

  async function schedulePost(post: PostItem) {
    if (!confirmAction("Schedule draft post?", "A pending publish job will be created for this post.")) return;
    setBusyId(post.id);
    try {
      await apiPost(`/api/posts/${post.id}/schedule`, { scheduledAt: post.scheduledAt });
      showToast("Post scheduled successfully.", "success");
      await refresh();
    } catch (scheduleError) {
      showToast(scheduleError instanceof Error ? scheduleError.message : "Could not schedule post.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function cancelPost(post: PostItem) {
    if (!confirmAction("Cancel scheduled post?", "This action will cancel pending publish jobs for this post.")) return;
    setBusyId(post.id);
    try {
      await apiPost(`/api/posts/${post.id}/cancel`);
      showToast("Post cancelled.", "success");
      await refresh();
    } catch (cancelError) {
      showToast(cancelError instanceof Error ? cancelError.message : "Could not cancel post.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function retryPost(post: PostItem) {
    if (!confirmAction("Retry failed post?", "The latest failed job will be queued again when safe to retry.")) return;
    setBusyId(post.id);
    try {
      await apiPost(`/api/posts/${post.id}/retry`);
      showToast("Post retry queued.", "success");
      await refresh();
    } catch (retryError) {
      showToast(retryError instanceof Error ? retryError.message : "Could not retry post.", "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1 className="page-title">Posts</h1>
          <p className="page-description">Create, schedule and monitor Facebook Reels posts.</p>
        </div>
        <ButtonLink href="/posts/new" tone="primary">Create Post</ButtonLink>
      </div>

      <div className="filter-bar">
        <Select id="post-status" label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
          {postStatuses.map((item) => (
            <option key={item || "all"} value={item}>{item || "All statuses"}</option>
          ))}
        </Select>
        <Select id="post-page" label="Page" value={pageId} onChange={(event) => setPageId(event.target.value)}>
          <option value="">All Pages</option>
          {pages.map((page) => (
            <option key={page.id} value={page.id}>{page.name}</option>
          ))}
        </Select>
        <Input
          className="field-search"
          id="post-search"
          label="Search caption"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Caption text"
        />
      </div>

      <TableWrap>
        {filteredPosts.length ? (
          <DataTable>
            <thead>
              <tr>
                <th>Caption</th>
                <th>Page</th>
                <th>Media</th>
                <th>Type</th>
                <th>Scheduled At</th>
                <th>Status</th>
                <th>Attempts</th>
                <th>Published At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map((post) => (
                <tr key={post.id}>
                  <td className="caption-preview" title={post.caption}>{truncate(post.caption, 80)}</td>
                  <td>{post.facebookPage.name}</td>
                  <td className="caption-preview" title={post.mediaAsset?.filename ?? ""}>{post.mediaAsset?.originalName ?? post.mediaAsset?.filename ?? "-"}</td>
                  <td>{post.type}</td>
                  <td>{formatDate(post.scheduledAt)}</td>
                  <td><PostStatusBadge status={post.status} /></td>
                  <td>{post.attempts}/{post.maxAttempts}</td>
                  <td>{formatDate(post.publishedAt)}</td>
                  <td>
                    <div className="table-actions">
                      {post.status === "DRAFT" ? (
                        <Button type="button" onClick={() => void schedulePost(post)} disabled={busyId === post.id}>
                          <CalendarPlus size={16} aria-hidden="true" />
                          Schedule
                        </Button>
                      ) : null}
                      {["DRAFT", "READY", "QUEUED"].includes(post.status) ? (
                        <Button tone="danger" type="button" onClick={() => void cancelPost(post)} disabled={busyId === post.id}>
                          <XCircle size={16} aria-hidden="true" />
                          Cancel
                        </Button>
                      ) : null}
                      {post.status === "FAILED" ? (
                        <Button type="button" onClick={() => void retryPost(post)} disabled={busyId === post.id}>
                          <RotateCcw size={16} aria-hidden="true" />
                          Retry
                        </Button>
                      ) : null}
                      <ButtonLink href={`/logs?postId=${post.id}`}>
                        <Eye size={16} aria-hidden="true" />
                        View Logs
                      </ButtonLink>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        ) : posts.length ? (
          <EmptyState title="No posts match the filters." description="Clear filters or search for another caption." action={<Search size={22} aria-hidden="true" />} />
        ) : (
          <EmptyState title="No posts yet." description="Create your first Reel schedule." action={<ButtonLink href="/posts/new" tone="primary">Create Post</ButtonLink>} />
        )}
      </TableWrap>
      <ToastViewport toast={toast} onDismiss={clearToast} />
    </div>
  );
}
