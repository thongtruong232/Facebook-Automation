import type { HTMLAttributes, TableHTMLAttributes } from "react";

export function TableWrap({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={["table-wrap", className].filter(Boolean).join(" ")} {...props} />;
}

export function DataTable({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return <table className={["data-table", className].filter(Boolean).join(" ")} {...props} />;
}
