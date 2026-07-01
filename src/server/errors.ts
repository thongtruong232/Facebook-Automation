import { NON_RETRYABLE_STATUS_CODES, RETRYABLE_STATUS_CODES } from "../lib/constants";

type AppErrorOptions = {
  code?: string;
  retryable?: boolean;
  statusCode?: number;
};

export class AppError extends Error {
  code: string;
  retryable: boolean;
  statusCode?: number;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = new.target.name;
    this.code = options.code ?? "APP_ERROR";
    this.retryable = options.retryable ?? false;
    this.statusCode = options.statusCode;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code = "VALIDATION_ERROR", statusCode = 400) {
    super(message, { code, retryable: false, statusCode });
  }
}

export class RetryableJobError extends AppError {
  constructor(message: string, code = "RETRYABLE_JOB_ERROR", statusCode?: number) {
    super(message, { code, retryable: true, statusCode });
  }
}

export class NonRetryableJobError extends AppError {
  constructor(message: string, code = "NON_RETRYABLE_JOB_ERROR", statusCode?: number) {
    super(message, { code, retryable: false, statusCode });
  }
}

export class MetaApiNotImplementedError extends AppError {
  constructor() {
    super("Meta API real publishing is not implemented yet. Set DRY_RUN=true or implement real API calls.", {
      code: "META_API_NOT_IMPLEMENTED",
      retryable: false,
      statusCode: 501
    });
  }
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof AppError) return error.retryable;

  const statusCode = getStatusCode(error);
  if (statusCode && RETRYABLE_STATUS_CODES.has(statusCode)) return true;
  if (statusCode && NON_RETRYABLE_STATUS_CODES.has(statusCode)) return false;

  const message = getErrorMessage(error);
  if (/validation|permission|invalid token|unauthorized|forbidden|not found/i.test(message)) {
    return false;
  }

  return /timeout|rate limit|temporary|dns|econnreset|econnrefused|network|bad gateway|service unavailable|gateway timeout/i.test(
    message
  );
}

export function getErrorCode(error: unknown): string {
  if (error instanceof AppError) return error.code;
  if (typeof error === "object" && error !== null && "code" in error && typeof error.code === "string") {
    return error.code;
  }
  return "UNKNOWN_ERROR";
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return String(error);
}

function getStatusCode(error: unknown): number | undefined {
  if (error instanceof AppError) return error.statusCode;
  if (typeof error === "object" && error !== null && "statusCode" in error && typeof error.statusCode === "number") {
    return error.statusCode;
  }
  return undefined;
}
