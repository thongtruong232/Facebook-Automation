/*
  Warnings:

  - You are about to drop the column `after_json` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `before_json` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `ip_address` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `user_agent` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `last_error` on the `facebook_pages` table. All the data in the column will be lost.
  - You are about to drop the column `token_status` on the `facebook_pages` table. All the data in the column will be lost.
  - You are about to drop the column `metadata_json` on the `media_assets` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `settings` table. All the data in the column will be lost.
  - You are about to drop the column `dry_run_checked_at` on the `social_posts` table. All the data in the column will be lost.
  - You are about to drop the column `hashtags` on the `social_posts` table. All the data in the column will be lost.
  - You are about to drop the column `internal_note` on the `social_posts` table. All the data in the column will be lost.
  - The `status` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- AlterEnum
ALTER TYPE "PageStatus" ADD VALUE 'TOKEN_INVALID';

-- DropIndex
DROP INDEX "audit_logs_entity_type_entity_id_idx";

-- DropIndex
DROP INDEX "audit_logs_user_id_created_at_idx";

-- DropIndex
DROP INDEX "facebook_pages_token_status_idx";

-- DropIndex
DROP INDEX "job_logs_job_id_created_at_idx";

-- DropIndex
DROP INDEX "job_logs_level_step_idx";

-- DropIndex
DROP INDEX "job_logs_social_post_id_created_at_idx";

-- DropIndex
DROP INDEX "publish_jobs_social_post_id_status_idx";

-- DropIndex
DROP INDEX "publish_jobs_status_run_at_idx";

-- DropIndex
DROP INDEX "social_posts_facebook_page_id_status_idx";

-- DropIndex
DROP INDEX "social_posts_status_scheduled_at_idx";

-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "after_json",
DROP COLUMN "before_json",
DROP COLUMN "ip_address",
DROP COLUMN "user_agent",
ADD COLUMN     "meta_json" JSONB;

-- AlterTable
ALTER TABLE "facebook_pages" DROP COLUMN "last_error",
DROP COLUMN "token_status",
ADD COLUMN     "last_token_error" TEXT;

-- AlterTable
ALTER TABLE "media_assets" DROP COLUMN "metadata_json",
ALTER COLUMN "type" SET DEFAULT 'VIDEO';

-- AlterTable
ALTER TABLE "settings" DROP COLUMN "description",
ALTER COLUMN "value" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "social_posts" DROP COLUMN "dry_run_checked_at",
DROP COLUMN "hashtags",
DROP COLUMN "internal_note";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "status",
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_idx" ON "audit_logs"("entity_type");

-- CreateIndex
CREATE INDEX "audit_logs_entity_id_idx" ON "audit_logs"("entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "job_logs_job_id_idx" ON "job_logs"("job_id");

-- CreateIndex
CREATE INDEX "job_logs_social_post_id_idx" ON "job_logs"("social_post_id");

-- CreateIndex
CREATE INDEX "job_logs_level_idx" ON "job_logs"("level");

-- CreateIndex
CREATE INDEX "job_logs_created_at_idx" ON "job_logs"("created_at");

-- CreateIndex
CREATE INDEX "publish_jobs_status_idx" ON "publish_jobs"("status");

-- CreateIndex
CREATE INDEX "publish_jobs_run_at_idx" ON "publish_jobs"("run_at");

-- CreateIndex
CREATE INDEX "publish_jobs_social_post_id_idx" ON "publish_jobs"("social_post_id");

-- CreateIndex
CREATE INDEX "social_posts_status_idx" ON "social_posts"("status");

-- CreateIndex
CREATE INDEX "social_posts_scheduled_at_idx" ON "social_posts"("scheduled_at");

-- CreateIndex
CREATE INDEX "social_posts_facebook_page_id_idx" ON "social_posts"("facebook_page_id");

-- CreateIndex
CREATE INDEX "social_posts_created_by_idx" ON "social_posts"("created_by");

-- CreateIndex
CREATE INDEX "social_posts_published_at_idx" ON "social_posts"("published_at");

-- CreateIndex
CREATE INDEX "users_role_status_idx" ON "users"("role", "status");
