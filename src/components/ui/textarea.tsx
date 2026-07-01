import type { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string | null;
  helperText?: string;
  counter?: string;
};

export function Textarea({ className, label, error, helperText, counter, id, ...props }: TextareaProps) {
  return (
    <div className="field">
      <div className="field-label-row">
        {label ? <label htmlFor={id}>{label}</label> : null}
        {counter ? <span className="field-counter">{counter}</span> : null}
      </div>
      <textarea
        className={["textarea", error ? "input-error" : null, className].filter(Boolean).join(" ")}
        id={id}
        {...props}
      />
      {helperText ? <p className="field-help">{helperText}</p> : null}
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  );
}
