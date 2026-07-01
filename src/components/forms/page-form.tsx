"use client";

import { Eye, EyeOff, Save } from "lucide-react";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import type { PageItem } from "@/lib/admin-types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";

type PageFormValues = {
  pageId: string;
  name: string;
  accessToken?: string;
  dailyLimit: string;
  timezone: string;
  status: string;
};

export function PageForm({
  page,
  submitting,
  onSubmit,
  onCancel
}: {
  page?: PageItem | null;
  submitting?: boolean;
  onSubmit: (values: PageFormValues) => Promise<void>;
  onCancel?: () => void;
}) {
  const [showToken, setShowToken] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const isEditing = Boolean(page);

  const defaults = useMemo<PageFormValues>(
    () => ({
      pageId: page?.pageId ?? "",
      name: page?.name ?? "",
      accessToken: "",
      dailyLimit: String(page?.dailyLimit ?? 30),
      timezone: page?.timezone ?? "Asia/Ho_Chi_Minh",
      status: page?.status ?? "ACTIVE"
    }),
    [page]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const formData = new FormData(event.currentTarget);
    const values: PageFormValues = {
      pageId: String(formData.get("pageId") ?? "").trim(),
      name: String(formData.get("name") ?? "").trim(),
      accessToken: String(formData.get("accessToken") ?? "").trim(),
      dailyLimit: String(formData.get("dailyLimit") ?? "30"),
      timezone: String(formData.get("timezone") ?? "").trim(),
      status: String(formData.get("status") ?? "ACTIVE")
    };

    if (!values.name || !values.pageId || (!isEditing && !values.accessToken)) {
      setFormError("Page name, Page ID and token are required.");
      return;
    }

    await onSubmit(values);
    event.currentTarget.reset();
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      {formError ? <div className="error-note">{formError}</div> : null}
      <div className="form-row">
        <Input id="name" name="name" label="Page Name" defaultValue={defaults.name} required />
        <Input id="pageId" name="pageId" label="Page ID" defaultValue={defaults.pageId} required readOnly={isEditing} />
      </div>
      <div className="field">
        <label htmlFor="accessToken">Access Token</label>
        <div className="button-row">
          <input
            className="input"
            id="accessToken"
            name="accessToken"
            type={showToken ? "text" : "password"}
            placeholder={isEditing ? "Leave blank to keep current token" : ""}
            required={!isEditing}
          />
          <Button type="button" onClick={() => setShowToken((current) => !current)} aria-label="Toggle token visibility">
            {showToken ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
            {showToken ? "Hide" : "Show"}
          </Button>
        </div>
        <p className="field-help">Token is encrypted before storing. It is never displayed again.</p>
      </div>
      <div className="form-row">
        <Input id="dailyLimit" name="dailyLimit" label="Daily Limit" type="number" min={1} max={200} defaultValue={defaults.dailyLimit} />
        <Input id="timezone" name="timezone" label="Timezone" defaultValue={defaults.timezone} required />
      </div>
      <Select id="status" name="status" label="Status" defaultValue={defaults.status}>
        <option value="ACTIVE">Active</option>
        <option value="DISABLED">Disabled</option>
        <option value="TOKEN_INVALID">Token invalid</option>
      </Select>
      <div className="button-row">
        <Button tone="primary" type="submit" disabled={submitting}>
          <Save size={16} aria-hidden="true" />
          {submitting ? "Saving..." : isEditing ? "Save Changes" : "Add Page"}
        </Button>
        {onCancel ? (
          <Button type="button" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
