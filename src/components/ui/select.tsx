import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string | null;
  helperText?: string;
};

export function Select({ className, label, error, helperText, id, children, ...props }: SelectProps) {
  return (
    <div className="field">
      {label ? <label htmlFor={id}>{label}</label> : null}
      <select
        className={["select", error ? "input-error" : null, className].filter(Boolean).join(" ")}
        id={id}
        {...props}
      >
        {children}
      </select>
      {helperText ? <p className="field-help">{helperText}</p> : null}
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  );
}
