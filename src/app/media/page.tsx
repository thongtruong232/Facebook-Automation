import { MediaScreen } from "@/components/screens/media-screen";
import { ErrorState } from "@/components/ui/error-state";
import { serializeMedia } from "@/lib/serializers";
import { listMedia } from "@/server/services/media.service";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  try {
    const media = (await listMedia()).map(serializeMedia);
    return <MediaScreen initialMedia={media} />;
  } catch (error) {
    return (
      <ErrorState
        title="Could not load media"
        message={error instanceof Error ? error.message : "Database is not available."}
      />
    );
  }
}
