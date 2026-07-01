import { PagesScreen } from "@/components/screens/pages-screen";
import { ErrorState } from "@/components/ui/error-state";
import { serializePage } from "@/lib/serializers";
import { listPages } from "@/server/services/page.service";

export const dynamic = "force-dynamic";

export default async function FacebookPagesPage() {
  try {
    const pages = (await listPages()).map(serializePage);
    return <PagesScreen initialPages={pages} />;
  } catch (error) {
    return (
      <ErrorState
        title="Could not load Facebook Pages"
        message={error instanceof Error ? error.message : "Database is not available."}
      />
    );
  }
}
