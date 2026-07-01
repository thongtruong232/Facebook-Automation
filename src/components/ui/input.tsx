import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string | null;
  helperText?: string;
};

export function Input({ className, label, error, helperText, id, ...props }: InputProps) {
  return (
    <div className="field">
      {label ? <label htmlFor={id}>{label}</label> : null}
      <input
        className={["input", error ? "input-error" : null, className].filter(Boolean).join(" ")}
        id={id}
        {...props}
      />
      {helperText ? <p className="field-help">{helperText}</p> : null}
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  );
}
