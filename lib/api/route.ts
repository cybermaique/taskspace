import "server-only";

import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function badRequest(message: string): never {
  throw new HttpError(400, message);
}

/**
 * Wraps a route handler with auth and uniform JSON error handling.
 * Row Level Security still scopes every query to the signed-in user.
 */
export function withAuth<Args extends unknown[]>(
  fallbackMessage: string,
  handler: (...args: Args) => Promise<Response>,
) {
  return async (...args: Args): Promise<Response> => {
    try {
      const user = await getCurrentUser();
      if (!user) throw new HttpError(401, "Sua sessão expirou. Entre novamente.");
      return await handler(...args);
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      const message = error instanceof Error && error.message ? error.message : fallbackMessage;
      return NextResponse.json({ error: message }, { status });
    }
  };
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await request.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    badRequest("Corpo da requisição inválido.");
  }
}

export async function readFile(request: Request) {
  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) badRequest("Selecione um arquivo.");
  if (file.size > 25 * 1024 * 1024) badRequest("O arquivo deve ter no máximo 25 MB.");
  return file;
}

export function optionalString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

export function nullableString(value: unknown) {
  return value === null || typeof value === "string" ? value : undefined;
}

export function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : undefined;
}

export function fileResponse(
  data: Blob,
  fileName: string,
  mimeType: string,
  forceDownload: boolean,
) {
  // Markup types could run scripts on this origin when opened directly.
  const isActiveMarkup = /html|svg|xml/i.test(mimeType);
  const canPreviewInline =
    !isActiveMarkup &&
    (mimeType.startsWith("image/") ||
    mimeType.startsWith("audio/") ||
    mimeType.startsWith("video/") ||
    mimeType.startsWith("text/") ||
    mimeType === "application/pdf" ||
    mimeType === "application/json");
  const disposition = canPreviewInline && !forceDownload ? "inline" : "attachment";

  return new NextResponse(data, {
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
