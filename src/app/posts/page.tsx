import { PostsScreen } from "@/components/screens/posts-screen";
import { ErrorState } from "@/components/ui/error-state";
import { serializePost } from "@/lib/serializers";
import { listPosts } from "@/server/services/post.service";

export const dynamic = "force-dynamic";

export default async function PostsPage() {
  try {
    const posts = (await listPosts()).map(serializePost);
    return <PostsScreen initialPosts={posts} />;
  } catch (error) {
    return (
      <ErrorState
        title="Could not load posts"
        message={error instanceof Error ? error.message : "Database is not available."}
      />
    );
  }
}
