"use client";

import { Upload, Video } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { apiUpload } from "@/lib/client-api";
import { formatBytes } from "@/lib/format";
import { Button } from "../ui/button";

export function MediaUploadForm({ onUploaded }: { onUploaded: () => Promise<void> }) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Choose a video file before uploading.");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.set("file", file);
      await apiUpload("/api/media/upload", formData);
      setSuccess("Upload completed.");
      setFile(null);
      event.currentTarget.reset();
      await onUploaded();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <label className="upload-dropzone" htmlFor="media-file">
        <Video size={34} aria-hidden="true" />
        <strong>Drag and drop video here</strong>
        <span className="muted">or choose a local mp4, mov, or webm file.</span>
        <input
          id="media-file"
          name="file"
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </label>
      {file ? (
        <div className="card preview-card">
          <div className="preview-item">
            <span className="preview-label">Filename</span>
            <strong>{file.name}</strong>
          </div>
          <div className="form-row">
            <div className="preview-item">
              <span className="preview-label">Size</span>
              <span>{formatBytes(file.size)}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">MIME type</span>
              <span>{file.type || "-"}</span>
            </div>
          </div>
        </div>
      ) : null}
      {error ? <div className="error-note">{error}</div> : null}
      {success ? <div className="toast toast-success" style={{ position: "static", maxWidth: "100%" }}>{success}</div> : null}
      <Button tone="primary" type="submit" disabled={uploading}>
        <Upload size={16} aria-hidden="true" />
        {uploading ? "Uploading..." : "Upload"}
      </Button>
    </form>
  );
}
