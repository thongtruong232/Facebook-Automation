import Link from "next/link";
import { Eye, Plus, RotateCcw, XCircle } from "lucide-react";
import { EmptyState } from "../_components/empty-state";
import { StatusBadge } from "../_components/status-badge";
import { formatDateTime } from "@/lib/time";
import { listPosts } from "@/server/services/post.service";

export const dynamic = "force-dynamic";

async function loadPosts() {
  try {
    return { posts: await listPosts(), error: null };
  } catch (error) {
    return { posts: [], error: error instanceof Error ? error.message : "Database is not available." };
  }
}

export default async function PostsPage() {
  const { posts, error } = await loadPosts();

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Posts / Reels</h1>
        <Link className="button button-primary" href="/posts/new">
          <Plus size={16} aria-hidden="true" />
          New Post
        </Link>
      </div>
      {error ? <div className="error-note">{error}</div> : null}
      <div className="table-wrap">
        {posts.length ? (
          <table>
            <thead>
              <tr>
                <th>Caption</th>
                <th>Page</th>
                <th>Type</th>
                <th>Scheduled At</th>
                <th>Status</th>
                <th>Attempts</th>
                <th>Published At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td className="caption-preview">{post.caption}</td>
                  <td>{post.facebookPage.name}</td>
                  <td>{post.type}</td>
                  <td>{formatDateTime(post.scheduledAt)}</td>
                  <td>
                    <StatusBadge status={post.status} />
                  </td>
                  <td>
                    {post.attempts}/{post.maxAttempts}
                  </td>
                  <td>{formatDateTime(post.publishedAt)}</td>
                  <td>
                    <div className="button-row">
                      <button className="button" disabled title="Preview">
                        <Eye size={16} aria-hidden="true" />
                        Preview
                      </button>
                      <form action={`/api/posts/${post.id}/retry`} method="post">
                        <button className="button" type="submit" title="Retry">
                          <RotateCcw size={16} aria-hidden="true" />
                          Retry
                        </button>
                      </form>
                      <form action={`/api/posts/${post.id}/cancel`} method="post">
                        <button className="button button-danger" type="submit" title="Cancel">
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
          <EmptyState label="No posts" />
        )}
      </div>
    </>
  );
}
