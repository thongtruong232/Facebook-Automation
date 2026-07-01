import type { HTMLAttributes, ReactNode } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <section className={["card", className].filter(Boolean).join(" ")} {...props} />;
}

export function CardHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="card-header">
      <div>
        <h2 className="card-title">{title}</h2>
        {description ? <p className="card-description">{description}</p> : null}
      </div>
      {action ? <div className="card-action">{action}</div> : null}
    </div>
  );
}

export function MetricCard({
  title,
  value,
  description,
  icon
}: {
  title: string;
  value: number | string;
  description?: string;
  icon?: ReactNode;
}) {
  return (
    <Card className="metric-card">
      <div className="metric-topline">
        <span className="metric-label">{title}</span>
        {icon ? <span className="metric-icon">{icon}</span> : null}
      </div>
      <div className="metric-value">{value}</div>
      {description ? <div className="metric-description">{description}</div> : null}
    </Card>
  );
}
