"use client";

import { Edit3, FlaskConical, Plus, PowerOff } from "lucide-react";
import { useCallback, useState } from "react";
import type { PageItem } from "@/lib/admin-types";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/client-api";
import { formatDate, truncate } from "@/lib/format";
import { PageForm } from "../forms/page-form";
import { PageStatusBadge } from "../status/page-status-badge";
import { Button } from "../ui/button";
import { Card, CardHeader } from "../ui/card";
import { confirmAction } from "../ui/confirm-dialog";
import { EmptyState } from "../ui/empty-state";
import { ErrorState } from "../ui/error-state";
import { DataTable, TableWrap } from "../ui/table";
import { ToastViewport, useToast } from "../ui/toast";

export function PagesScreen({ initialPages }: { initialPages: PageItem[] }) {
  const [pages, setPages] = useState(initialPages);
  const [showForm, setShowForm] = useState(initialPages.length === 0);
  const [editingPage, setEditingPage] = useState<PageItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast, showToast, clearToast } = useToast();

  const refresh = useCallback(async () => {
    setPages(await apiGet<PageItem[]>("/api/facebook-pages"));
  }, []);

  async function submitPage(values: {
    pageId: string;
    name: string;
    accessToken?: string;
    dailyLimit: string;
    timezone: string;
    status: string;
  }) {
    setLoading(true);
    setError(null);
    try {
      if (editingPage) {
        const payload: Record<string, string | number> = {
          name: values.name,
          dailyLimit: Number(values.dailyLimit),
          timezone: values.timezone,
          status: values.status
        };
        if (values.accessToken) payload.accessToken = values.accessToken;
        await apiPatch(`/api/facebook-pages/${editingPage.id}`, payload);
        showToast("Page updated successfully.", "success");
      } else {
        await apiPost("/api/facebook-pages", {
          pageId: values.pageId,
          name: values.name,
          accessToken: values.accessToken,
          dailyLimit: Number(values.dailyLimit),
          timezone: values.timezone,
          status: values.status
        });
        showToast("Page created successfully.", "success");
      }
      setEditingPage(null);
      setShowForm(false);
      await refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not save Page.");
    } finally {
      setLoading(false);
    }
  }

  async function testToken(page: PageItem) {
    setBusyId(page.id);
    try {
      const result = await apiPost<{ valid: boolean }>(`/api/facebook-pages/${page.id}/test-token`);
      showToast(result.valid ? "Token test passed." : "Token test failed.", result.valid ? "success" : "error");
      await refresh();
    } catch (testError) {
      showToast(testError instanceof Error ? testError.message : "Token test failed.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function disablePage(page: PageItem) {
    if (!confirmAction("Disable Page?", "Scheduled posts for this Page should be reviewed before disabling it.")) return;
    setBusyId(page.id);
    try {
      await apiDelete(`/api/facebook-pages/${page.id}`);
      showToast("Page disabled.", "success");
      await refresh();
    } catch (disableError) {
      showToast(disableError instanceof Error ? disableError.message : "Could not disable Page.", "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1 className="page-title">Facebook Pages</h1>
          <p className="page-description">Manage Facebook Pages used for automated Reels publishing.</p>
        </div>
        <Button tone="primary" type="button" onClick={() => { setEditingPage(null); setShowForm(true); }}>
          <Plus size={16} aria-hidden="true" />
          Add Page
        </Button>
      </div>

      {error ? <ErrorState title="Could not save Page" message={error} /> : null}

      {showForm || editingPage ? (
        <Card>
          <CardHeader title={editingPage ? "Edit Page" : "Add Page"} description="Tokens are encrypted before storage and never returned to the browser." />
          <PageForm
            key={editingPage?.id ?? "new"}
            page={editingPage}
            submitting={loading}
            onSubmit={submitPage}
            onCancel={() => { setEditingPage(null); setShowForm(false); }}
          />
        </Card>
      ) : null}

      <TableWrap>
        {pages.length ? (
          <DataTable>
            <thead>
              <tr>
                <th>Name</th>
                <th>Page ID</th>
                <th>Daily Limit</th>
                <th>Timezone</th>
                <th>Status</th>
                <th>Last Token Check</th>
                <th>Last Token Error</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.id}>
                  <td>{page.name}</td>
                  <td className="id-text" title={page.pageId}>{page.pageId}</td>
                  <td>{page.dailyLimit}</td>
                  <td>{page.timezone}</td>
                  <td><PageStatusBadge status={page.status} /></td>
                  <td>{formatDate(page.lastTokenCheckAt)}</td>
                  <td className="caption-preview" title={page.lastTokenError ?? ""}>{page.lastTokenError ? truncate(page.lastTokenError, 80) : "-"}</td>
                  <td>
                    <div className="table-actions">
                      <Button type="button" onClick={() => void testToken(page)} disabled={busyId === page.id}>
                        <FlaskConical size={16} aria-hidden="true" />
                        Test Token
                      </Button>
                      <Button type="button" onClick={() => { setEditingPage(page); setShowForm(true); }}>
                        <Edit3 size={16} aria-hidden="true" />
                        Edit
                      </Button>
                      <Button tone="danger" type="button" onClick={() => void disablePage(page)} disabled={busyId === page.id || page.status === "DISABLED"}>
                        <PowerOff size={16} aria-hidden="true" />
                        Disable
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        ) : (
          <EmptyState title="No Facebook Pages yet." description="Add a Page to start scheduling Reels." />
        )}
      </TableWrap>
      <ToastViewport toast={toast} onDismiss={clearToast} />
    </div>
  );
}
