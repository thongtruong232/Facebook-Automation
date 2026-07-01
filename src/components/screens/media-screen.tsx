"use client";

import { Copy, Trash2, Video } from "lucide-react";
import { useCallback, useState } from "react";
import type { MediaItem } from "@/lib/admin-types";
import { apiDelete, apiGet } from "@/lib/client-api";
import { formatBytes, formatDate } from "@/lib/format";
import { MediaUploadForm } from "../forms/media-upload-form";
import { MediaStatusBadge } from "../status/media-status-badge";
import { Button } from "../ui/button";
import { Card, CardHeader } from "../ui/card";
import { confirmAction } from "../ui/confirm-dialog";
import { EmptyState } from "../ui/empty-state";
import { DataTable, TableWrap } from "../ui/table";
import { ToastViewport, useToast } from "../ui/toast";

export function MediaScreen({ initialMedia }: { initialMedia: MediaItem[] }) {
  const [media, setMedia] = useState(initialMedia);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { toast, showToast, clearToast } = useToast();

  const refresh = useCallback(async () => {
    setMedia(await apiGet<MediaItem[]>("/api/media"));
  }, []);

  async function copyPath(path: string) {
    try {
      await navigator.clipboard.writeText(path);
      showToast("Storage path copied.", "success");
    } catch {
      showToast("Could not copy path.", "error");
    }
  }

  async function deleteMedia(item: MediaItem) {
    if (!confirmAction("Archive media?", "This marks the media as deleted. Existing post history will remain.")) return;
    setBusyId(item.id);
    try {
      await apiDelete(`/api/media/${item.id}`);
      showToast("Media archived.", "success");
      await refresh();
    } catch (deleteError) {
      showToast(deleteError instanceof Error ? deleteError.message : "Could not archive media.", "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1 className="page-title">Media Library</h1>
          <p className="page-description">Upload and manage local video files used by scheduled Reels.</p>
        </div>
      </div>

      <Card>
        <CardHeader title="Upload video" description="The worker uses local storage paths. No video is uploaded to Meta from the browser." />
        <MediaUploadForm onUploaded={refresh} />
      </Card>

      <TableWrap>
        {media.length ? (
          <DataTable>
            <thead>
              <tr>
                <th>Preview</th>
                <th>Filename</th>
                <th>Original Name</th>
                <th>Type</th>
                <th>Size</th>
                <th>MIME</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {media.map((item) => (
                <tr key={item.id}>
                  <td><Video size={22} aria-label="Video file" /></td>
                  <td className="caption-preview" title={item.filename}>{item.filename}</td>
                  <td className="caption-preview" title={item.originalName ?? ""}>{item.originalName ?? "-"}</td>
                  <td>{item.type}</td>
                  <td>{formatBytes(item.sizeBytes ?? 0)}</td>
                  <td>{item.mimeType ?? "-"}</td>
                  <td><MediaStatusBadge status={item.status} /></td>
                  <td>{formatDate(item.createdAt)}</td>
                  <td>
                    <div className="table-actions">
                      <Button type="button" onClick={() => void copyPath(item.storagePath)}>
                        <Copy size={16} aria-hidden="true" />
                        Copy Path
                      </Button>
                      <Button tone="danger" type="button" onClick={() => void deleteMedia(item)} disabled={busyId === item.id || item.status === "DELETED"}>
                        <Trash2 size={16} aria-hidden="true" />
                        Archive
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        ) : (
          <EmptyState title="No media files uploaded." description="Upload a video to create your first Reel." />
        )}
      </TableWrap>
      <ToastViewport toast={toast} onDismiss={clearToast} />
    </div>
  );
}
