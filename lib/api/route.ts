import "server-only";

import { NextResponse } from "next/server";
import type { z } from "zod";

import { describeIssue } from "@/lib/api/schemas";
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

/** Parses and validates a JSON body; invalid input becomes a 400 with a readable message. */
export async function parseJson<Schema extends z.ZodType>(
  request: Request,
  schema: Schema,
): Promise<z.infer<Schema>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    badRequest("Corpo da requisição inválido.");
  }
  const result = schema.safeParse(body);
  if (!result.success) badRequest(describeIssue(result.error));
  return result.data;
}

export async function readFile(request: Request) {
  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) badRequest("Selecione um arquivo.");
  if (file.size > 25 * 1024 * 1024) badRequest("O arquivo deve ter no máximo 25 MB.");
  return file;
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
