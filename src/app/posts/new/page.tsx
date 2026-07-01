import { PostForm } from "@/components/forms/post-form";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { serializeMedia, serializePage } from "@/lib/serializers";
import { listMedia } from "@/server/services/media.service";
import { listPages } from "@/server/services/page.service";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  try {
    const [pages, media] = await Promise.all([listPages(), listMedia()]);
    return (
      <div className="stack">
        <PageHeader title="Create Post" description="Create a draft or schedule a Reel for the background worker." />
        <PostForm pages={pages.map(serializePage)} media={media.map(serializeMedia)} />
      </div>
    );
  } catch (error) {
    return (
      <ErrorState
        title="Could not load create post form"
        message={error instanceof Error ? error.message : "Database is not available."}
      />
    );
  }
}
