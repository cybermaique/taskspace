import { NextResponse, type NextRequest } from "next/server";

import { fileResponse, withAuth } from "@/lib/api/route";
import {
  deleteTaskAttachment,
  getTaskAttachment,
  markTaskAttachmentViewed,
} from "@/lib/tasks";

type Context = { params: Promise<{ id: string; attachmentId: string }> };

export const GET = withAuth(
  "Arquivo não encontrado.",
  async (request: NextRequest, { params }: Context) => {
    const { id, attachmentId } = await params;
    const { attachment, data } = await getTaskAttachment(id, attachmentId);
    const isPdf = attachment.file_name.toLocaleLowerCase().endsWith(".pdf");
    const mimeType =
      attachment.mime_type === "application/octet-stream" && isPdf
        ? "application/pdf"
        : attachment.mime_type;

    return fileResponse(
      data,
      attachment.file_name,
      mimeType,
      request.nextUrl.searchParams.get("download") === "1",
    );
  },
);

/** Records that the attachment was opened. */
export const POST = withAuth(
  "Não foi possível registrar a visualização.",
  async (_request: Request, { params }: Context) => {
    const { id, attachmentId } = await params;
    await markTaskAttachmentViewed(id, attachmentId);
    return NextResponse.json({ success: true });
  },
);

export const DELETE = withAuth(
  "Erro ao excluir anexo.",
  async (_request: Request, { params }: Context) => {
    const { id, attachmentId } = await params;
    return NextResponse.json({ task: await deleteTaskAttachment(id, attachmentId) });
  },
);
