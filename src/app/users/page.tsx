import { EmptyState } from "../_components/empty-state";

export default function UsersPage() {
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Users</h1>
      </div>
      <section className="panel">
        <EmptyState label="No users" />
      </section>
    </>
  );
}
