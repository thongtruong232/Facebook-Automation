"use client";

import { Save, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { MediaItem, PageItem } from "@/lib/admin-types";
import { apiPost } from "@/lib/client-api";
import { formatBytes, formatDate } from "@/lib/format";
import { Button, ButtonLink } from "../ui/button";
import { Card, CardHeader } from "../ui/card";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Textarea } from "../ui/textarea";

export function PostForm({ pages, media }: { pages: PageItem[]; media: MediaItem[] }) {
  const router = useRouter();
  const activePages = useMemo(() => pages.filter((page) => page.status === "ACTIVE"), [pages]);
  const readyVideos = useMemo(() => media.filter((item) => item.status === "READY" && item.type === "VIDEO"), [media]);
  const [pageId, setPageId] = useState(activePages[0]?.id ?? "");
  const [mediaId, setMediaId] = useState(readyVideos[0]?.id ?? "");
  const [type, setType] = useState("REEL");
  const [caption, setCaption] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<"draft" | "schedule" | null>(null);

  const selectedPage = activePages.find((page) => page.id === pageId) ?? null;
  const selectedMedia = readyVideos.find((item) => item.id === mediaId) ?? null;
  const hasRequiredData = activePages.length > 0 && readyVideos.length > 0;

  async function submit(intent: "draft" | "schedule") {
    setError(null);

    if (!pageId || !mediaId || !caption.trim()) {
      setError("Page, video and caption are required.");
      return;
    }

    if (intent === "schedule" && !scheduledAt) {
      setError("Scheduled time is required when scheduling.");
      return;
    }

    setSubmitting(intent);
    try {
      await apiPost("/api/posts", {
        facebookPageId: pageId,
        mediaAssetId: mediaId,
        type,
        caption,
        scheduledAt: scheduledAt || undefined,
        intent
      });
      router.push("/posts");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not save post.");
    } finally {
      setSubmitting(null);
    }
  }

  if (!hasRequiredData) {
    return (
      <div className="two-column">
        <Card>
          <CardHeader title="Missing setup" description="Create an active Page and upload a ready video before creating a Reel." />
          <div className="button-row">
            {!activePages.length ? <ButtonLink href="/pages">Go to Facebook Pages</ButtonLink> : null}
            {!readyVideos.length ? <ButtonLink href="/media">Upload Media</ButtonLink> : null}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="form-layout">
      <Card>
        <CardHeader title="Post details" description="Save a draft or schedule a Reel for the background worker." />
        <div className="form-grid">
          {error ? <div className="error-note">{error}</div> : null}
          <Select id="facebookPageId" label="Facebook Page" value={pageId} onChange={(event) => setPageId(event.target.value)}>
            {activePages.map((page) => (
              <option key={page.id} value={page.id}>
                {page.name} - {page.pageId}
              </option>
            ))}
          </Select>
          <Select id="mediaAssetId" label="Media / Video" value={mediaId} onChange={(event) => setMediaId(event.target.value)}>
            {readyVideos.map((item) => (
              <option key={item.id} value={item.id}>
                {(item.originalName ?? item.filename)} - {formatBytes(item.sizeBytes ?? 0)}
              </option>
            ))}
          </Select>
          <Select id="type" label="Post Type" value={type} onChange={(event) => setType(event.target.value)}>
            <option value="REEL">Reel</option>
            <option value="VIDEO">Video</option>
          </Select>
          <Textarea
            id="caption"
            label="Caption"
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            helperText="Write the Reel caption. Hashtags can be included."
            counter={`${caption.length}/5000`}
            required
          />
          <Input
            id="scheduledAt"
            label="Scheduled At"
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
            helperText="If scheduled time is in the past, the worker can publish it on the next run."
          />
          <div className="button-row">
            <Button type="button" onClick={() => void submit("draft")} disabled={Boolean(submitting)}>
              <Save size={16} aria-hidden="true" />
              {submitting === "draft" ? "Saving..." : "Save Draft"}
            </Button>
            <Button tone="primary" type="button" onClick={() => void submit("schedule")} disabled={Boolean(submitting)}>
              <Send size={16} aria-hidden="true" />
              {submitting === "schedule" ? "Scheduling..." : "Schedule"}
            </Button>
          </div>
        </div>
      </Card>
      <div className="grid">
        <Card className="preview-card">
          <CardHeader title="Preview" description="A quick check before saving." />
          <PreviewItem label="Selected Page" value={selectedPage ? `${selectedPage.name} - ${selectedPage.pageId}` : "-"} />
          <PreviewItem label="Selected Video" value={selectedMedia?.originalName ?? selectedMedia?.filename ?? "-"} />
          <PreviewItem label="Caption preview" value={caption || "-"} />
          <PreviewItem label="Scheduled time" value={scheduledAt ? formatDate(scheduledAt) : "-"} />
          <PreviewItem label="Status preview" value={scheduledAt ? "Ready to schedule" : "Draft"} />
        </Card>
        <Card>
          <CardHeader title="Before scheduling" />
          <ul className="checklist">
            <ChecklistItem checked={Boolean(selectedPage)} label="Page is active" />
            <ChecklistItem checked={Boolean(selectedMedia)} label="Video is uploaded" />
            <ChecklistItem checked={Boolean(caption.trim())} label="Caption is not empty" />
            <ChecklistItem checked={Boolean(scheduledAt)} label="Scheduled time is valid" />
          </ul>
        </Card>
      </div>
    </div>
  );
}

function PreviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="preview-item">
      <span className="preview-label">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function ChecklistItem({ checked, label }: { checked: boolean; label: string }) {
  return (
    <li>
      <span className="checkmark">{checked ? "OK" : "-"}</span>
      {label}
    </li>
  );
}
