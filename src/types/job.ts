import type { JobType, PublishJobStatus } from "@prisma/client";

export type PublishJobListItem = {
  id: string;
  runId: string;
  jobType: JobType;
  status: PublishJobStatus;
  runAt: Date;
  attempts: number;
  maxAttempts: number;
  errorMessage?: string | null;
};
