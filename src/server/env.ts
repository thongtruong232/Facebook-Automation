import "dotenv/config";
import { z } from "zod";

const numberFromEnv = (fallback: number) =>
  z.preprocess(
    (value) => (value === undefined || value === "" ? fallback : Number(value)),
    z.number().int().positive()
  );

const booleanFromEnv = (fallback: boolean) =>
  z.preprocess(
    (value) => {
      if (value === undefined || value === "") return fallback;
      if (typeof value === "boolean") return value;
      return String(value).toLowerCase() === "true";
    },
    z.boolean()
  );

const envSchema = z.object({
  APP_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  META_GRAPH_VERSION: z.string().min(1).default("v25.0"),
  META_APP_ID: z.string().default(""),
  META_APP_SECRET: z.string().default(""),
  TOKEN_ENCRYPTION_KEY: z.string().min(1),
  DRY_RUN: booleanFromEnv(true),
  STORAGE_DRIVER: z.enum(["local", "s3", "wasabi"]).default("local"),
  UPLOAD_DIR: z.string().min(1).default("./uploads"),
  DEFAULT_TIMEZONE: z.string().min(1).default("Asia/Ho_Chi_Minh"),
  MAX_REELS_PER_PAGE_PER_DAY: numberFromEnv(30),
  MAX_POSTS_PER_RUN: numberFromEnv(1),
  MAX_RETRY: numberFromEnv(3),
  TELEGRAM_BOT_TOKEN: z.string().default(""),
  TELEGRAM_CHAT_ID: z.string().default("")
});

export const env = envSchema.parse(process.env);

if (env.APP_ENV === "production" && env.TOKEN_ENCRYPTION_KEY === "change-this-32-byte-key") {
  throw new Error("Set TOKEN_ENCRYPTION_KEY to a real secret in production.");
}
