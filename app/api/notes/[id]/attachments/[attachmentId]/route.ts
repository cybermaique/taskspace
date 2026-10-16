import { NextResponse, type NextRequest } from "next/server";

import { fileResponse, withAuth } from "@/lib/api/route";
import { deleteNoteAttachment, getNoteAttachment } from "@/lib/notes";

type Context = { params: Promise<{ id: string; attachmentId: string }> };

export const GET = withAuth(
  "Não foi possível abrir o anexo.",
  async (request: NextRequest, { params }: Context) => {
    const { id, attachmentId } = await params;
    const { attachment, data } = await getNoteAttachment(id, attachmentId);
    return fileResponse(
      data,
      attachment.file_name,
      attachment.mime_type,
      request.nextUrl.searchParams.get("download") === "1",
    );
  },
);

export const DELETE = withAuth(
  "Não foi possível excluir o anexo.",
  async (_request: Request, { params }: Context) => {
    const { id, attachmentId } = await params;
    return NextResponse.json({ note: await deleteNoteAttachment(id, attachmentId) });
  },
);
