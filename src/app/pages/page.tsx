import { FlaskConical, Plus } from "lucide-react";
import { EmptyState } from "../_components/empty-state";
import { StatusBadge } from "../_components/status-badge";
import { formatDateTime } from "@/lib/time";
import { listPages } from "@/server/services/page.service";

export const dynamic = "force-dynamic";

async function loadPages() {
  try {
    return { pages: await listPages(), error: null };
  } catch (error) {
    return { pages: [], error: error instanceof Error ? error.message : "Database is not available." };
  }
}

export default async function FacebookPagesPage() {
  const { pages, error } = await loadPages();

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Facebook Pages</h1>
      </div>
      {error ? <div className="error-note">{error}</div> : null}
      <section className="panel">
        <form className="form-grid" action="/api/facebook-pages" method="post">
          <div className="split">
            <div className="field">
              <label htmlFor="pageId">Page ID</label>
              <input className="input" id="pageId" name="pageId" required />
            </div>
            <div className="field">
              <label htmlFor="name">Page Name</label>
              <input className="input" id="name" name="name" required />
            </div>
          </div>
          <div className="field">
            <label htmlFor="accessToken">Page Access Token</label>
            <input className="input" id="accessToken" name="accessToken" type="password" required />
          </div>
          <div className="split">
            <div className="field">
              <label htmlFor="dailyLimit">Daily Limit</label>
              <input className="input" id="dailyLimit" name="dailyLimit" type="number" defaultValue="30" min="1" />
            </div>
            <div className="field">
              <label htmlFor="timezone">Timezone</label>
              <input className="input" id="timezone" name="timezone" defaultValue="Asia/Ho_Chi_Minh" />
            </div>
          </div>
          <button className="button button-primary" type="submit">
            <Plus size={16} aria-hidden="true" />
            Add Page
          </button>
        </form>
      </section>
      <div style={{ height: 16 }} />
      <div className="table-wrap">
        {pages.length ? (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Page ID</th>
                <th>Token</th>
                <th>Status</th>
                <th>Daily Limit</th>
                <th>Last Check</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.id}>
                  <td>{page.name}</td>
                  <td>{page.pageId}</td>
                  <td>{page.maskedToken}</td>
                  <td>
                    <StatusBadge status={page.status} />
                  </td>
                  <td>{page.dailyLimit}</td>
                  <td>{formatDateTime(page.lastTokenCheckAt)}</td>
                  <td>
                    <form action={`/api/facebook-pages/${page.id}/test-token`} method="post">
                      <button className="button" type="submit">
                        <FlaskConical size={16} aria-hidden="true" />
                        Test
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState label="No Pages" />
        )}
      </div>
    </>
  );
}
