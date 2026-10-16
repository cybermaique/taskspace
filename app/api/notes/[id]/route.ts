import { NextResponse } from "next/server";

import { parseJson, withAuth } from "@/lib/api/route";
import { updateNoteSchema } from "@/lib/api/schemas";
import { deleteNote, updateNote } from "@/lib/notes";

type Context = { params: Promise<{ id: string }> };

export const PATCH = withAuth(
  "Erro ao atualizar anotação.",
  async (request: Request, { params }: Context) => {
    const { id } = await params;
    const note = await updateNote(id, await parseJson(request, updateNoteSchema));
    return NextResponse.json({ note });
  },
);

export const DELETE = withAuth(
  "Erro ao excluir anotação.",
  async (_request: Request, { params }: Context) => {
    const { id } = await params;
    await deleteNote(id);
    return NextResponse.json({ success: true });
  },
);
