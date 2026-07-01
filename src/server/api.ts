import { NextResponse } from "next/server";
import { sanitizeError, toErrorLike } from "../lib/constants";
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
  const errorLike = toErrorLike(error);
  return jsonResponse(
    {
      error: errorLike.message ?? "Request failed.",
      details: sanitizeError(error)
    },
    { status: errorLike.statusCode ?? 500 }
  );
}
