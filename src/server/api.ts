import { NextResponse } from "next/server";
import { sanitizeError } from "../lib/constants";
import { getErrorMessage } from "./errors";
import { jsonResponse } from "./http";

export async function readRequestInput(request: Request): Promise<Record<string, string>> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await request.json()) as Record<string, string>;
  }

  const formData = await request.formData();
  return Object.fromEntries(
    Array.from(formData.entries()).flatMap(([key, value]) =>
      typeof value === "string" ? [[key, value]] : []
    )
  );
}

export function redirectTo(request: Request, pathname: string): NextResponse {
  return NextResponse.redirect(new URL(pathname, request.url), { status: 303 });
}

export function apiError(error: unknown): Response {
  const statusCode =
    typeof error === "object" && error !== null && "statusCode" in error && typeof error.statusCode === "number"
      ? error.statusCode
      : 500;

  return jsonResponse(
    {
      error: getErrorMessage(error),
      details: sanitizeError(error)
    },
    { status: statusCode }
  );
}
