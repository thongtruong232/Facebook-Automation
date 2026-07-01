import { Queue, type ConnectionOptions } from "bullmq";
import { env } from "./env";

export const FACEBOOK_REELS_QUEUE = "facebook-reels-publish";

let sharedConnection: ConnectionOptions | null = null;
let sharedQueue: Queue | null = null;

export function getQueueConnection(): ConnectionOptions {
  if (!sharedConnection) {
    const redisUrl = new URL(env.REDIS_URL);
    sharedConnection = {
      host: redisUrl.hostname,
      port: Number(redisUrl.port || 6379),
      username: redisUrl.username || undefined,
      password: redisUrl.password || undefined,
      maxRetriesPerRequest: null
    };
  }

  return sharedConnection;
}

export function getReelsQueue(): Queue {
  if (!sharedQueue) {
    sharedQueue = new Queue(FACEBOOK_REELS_QUEUE, {
      connection: getQueueConnection()
    });
  }

  return sharedQueue;
}

export async function enqueuePublishJob(jobId: string, runAt: Date): Promise<void> {
  const delay = Math.max(0, runAt.getTime() - Date.now());
  await getReelsQueue().add(
    "publish_reel",
    { jobId },
    {
      jobId,
      delay,
      removeOnComplete: 100,
      removeOnFail: 1000
    }
  );
}
