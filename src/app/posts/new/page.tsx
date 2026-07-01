import { Save, Send } from "lucide-react";
import { EmptyState } from "../../_components/empty-state";
import { listMedia } from "@/server/services/media.service";
import { listPages } from "@/server/services/page.service";

export const dynamic = "force-dynamic";

async function loadFormData() {
  try {
    const [pages, media] = await Promise.all([listPages(), listMedia()]);
    return { pages, media, error: null };
  } catch (error) {
    return {
      pages: [],
      media: [],
      error: error instanceof Error ? error.message : "Database is not available."
    };
  }
}

export default async function NewPostPage() {
  const { pages, media, error } = await loadFormData();

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">New Reel</h1>
      </div>
      {error ? <div className="error-note">{error}</div> : null}
      <section className="panel">
        {pages.length && media.length ? (
          <form className="form-grid" action="/api/posts" method="post">
            <div className="field">
              <label htmlFor="facebookPageId">Page</label>
              <select className="select" id="facebookPageId" name="facebookPageId" required>
                {pages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="mediaAssetId">Video</label>
              <select className="select" id="mediaAssetId" name="mediaAssetId" required>
                {media.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.originalName ?? item.filename}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="type">Type</label>
              <select className="select" id="type" name="type" defaultValue="REEL">
                <option value="REEL">Reel</option>
                <option value="VIDEO">Video</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="caption">Caption</label>
              <textarea className="textarea" id="caption" name="caption" required />
            </div>
            <div className="field">
              <label htmlFor="hashtags">Hashtags</label>
              <input className="input" id="hashtags" name="hashtags" />
            </div>
            <div className="field">
              <label htmlFor="scheduledAt">Scheduled At</label>
              <input className="input" id="scheduledAt" name="scheduledAt" type="datetime-local" required />
            </div>
            <div className="field">
              <label htmlFor="internalNote">Internal Note</label>
              <input className="input" id="internalNote" name="internalNote" />
            </div>
            <div className="button-row">
              <button className="button" name="intent" type="submit" value="draft">
                <Save size={16} aria-hidden="true" />
                Save Draft
              </button>
              <button className="button button-primary" name="intent" type="submit" value="schedule">
                <Send size={16} aria-hidden="true" />
                Schedule
              </button>
            </div>
          </form>
        ) : (
          <EmptyState label="Create at least one Page and upload one video" />
        )}
      </section>
    </>
  );
}
