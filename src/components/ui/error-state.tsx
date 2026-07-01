import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

export function ErrorState({ title, message, action }: { title: string; message?: string | null; action?: ReactNode }) {
  return (
    <div className="error-state" role="alert">
      <AlertCircle size={18} aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        {message ? <p>{message}</p> : null}
        {action ? <div className="error-action">{action}</div> : null}
      </div>
    </div>
  );
}
