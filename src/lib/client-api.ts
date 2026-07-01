"use client";

type ApiSuccess<T> = {
  success: true;
  data: T;
};

type ApiFailure = {
  success: false;
  error: {
    message: string;
    details?: unknown;
  };
};

type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export async function apiGet<T>(url: string): Promise<T> {
  return request<T>(url);
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  return request<T>(url, {
    method: "POST",
    body
  });
}

export async function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  return request<T>(url, {
    method: "PATCH",
    body
  });
}

export async function apiDelete<T>(url: string): Promise<T> {
  return request<T>(url, {
    method: "DELETE"
  });
}

async function request<T>(url: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const isFormData = init.body instanceof FormData;
  const response = await fetch(url, {
    method: init.method ?? "GET",
    headers: isFormData || init.body === undefined ? undefined : { "content-type": "application/json" },
    body: init.body === undefined ? undefined : isFormData ? init.body : JSON.stringify(init.body)
  });

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || !payload?.success) {
    throw new Error(payload && !payload.success ? payload.error.message : `Request failed with ${response.status}`);
  }

  return payload.data;
}
