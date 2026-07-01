import { DashboardScreen } from "@/components/screens/dashboard-screen";
import { ErrorState } from "@/components/ui/error-state";
import { serializeDashboard } from "@/lib/serializers";
import { getDashboardSummary } from "@/server/services/dashboard.service";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  try {
    const data = serializeDashboard(await getDashboardSummary());
    return <DashboardScreen initialData={data} />;
  } catch (error) {
    return (
      <ErrorState
        title="Could not load dashboard"
        message={error instanceof Error ? error.message : "Database is not available."}
      />
    );
  }
}
