import { Upload } from "lucide-react";
import { EmptyState } from "../_components/empty-state";
import { StatusBadge } from "../_components/status-badge";
import { formatDateTime } from "@/lib/time";
import { listMedia } from "@/server/services/media.service";

export const dynamic = "force-dynamic";

async function loadMedia() {
  try {
    return { media: await listMedia(), error: null };
  } catch (error) {
    return { media: [], error: error instanceof Error ? error.message : "Database is not available." };
  }
}

export default async function MediaPage() {
  const { media, error } = await loadMedia();

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Media Library</h1>
      </div>
      {error ? <div className="error-note">{error}</div> : null}
      <section className="panel">
        <form className="button-row" action="/api/media/upload" method="post" encType="multipart/form-data">
          <input className="input" name="file" type="file" accept="video/mp4,video/quicktime,video/webm" required />
          <button className="button button-primary" type="submit">
            <Upload size={16} aria-hidden="true" />
            Upload
          </button>
        </form>
      </section>
      <div style={{ height: 16 }} />
      <div className="table-wrap">
        {media.length ? (
          <table>
            <thead>
              <tr>
                <th>Filename</th>
                <th>MIME</th>
                <th>Size</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {media.map((item) => (
                <tr key={item.id}>
                  <td>{item.originalName ?? item.filename}</td>
                  <td>{item.mimeType ?? "-"}</td>
                  <td>{item.sizeBytes ? `${item.sizeBytes.toString()} bytes` : "-"}</td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                  <td>{formatDateTime(item.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState label="No media" />
        )}
      </div>
    </>
  );
}
