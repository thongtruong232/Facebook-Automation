import { JobsScreen } from "@/components/screens/jobs-screen";
import { ErrorState } from "@/components/ui/error-state";
import { serializeJob } from "@/lib/serializers";
import { listJobs } from "@/server/services/job.service";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  try {
    const jobs = (await listJobs()).map(serializeJob);
    return <JobsScreen initialJobs={jobs} />;
  } catch (error) {
    return (
      <ErrorState
        title="Could not load publish jobs"
        message={error instanceof Error ? error.message : "Database is not available."}
      />
    );
  }
}
