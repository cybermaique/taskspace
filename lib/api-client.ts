"use client";

/** Thin fetch wrapper for the app's JSON routes. Throws with the server's message. */
export async function apiRequest<T>(
  url: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, ...rest } = init;
  const response = await fetch(url, {
    ...rest,
    headers: json !== undefined ? { "Content-Type": "application/json", ...rest.headers } : rest.headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    // Some endpoints legitimately return empty bodies.
  }

  if (response.status === 401) {
    window.location.assign("/login");
  }

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : "Algo deu errado. Tente novamente.";
    throw new Error(message);
  }

  return data as T;
}

export function uploadFile<T>(url: string, file: File) {
  const body = new FormData();
  body.append("file", file);
  return apiRequest<T>(url, { method: "POST", body });
}

export function errorMessage(error: unknown, fallback = "Algo deu errado.") {
  return error instanceof Error && error.message ? error.message : fallback;
}
