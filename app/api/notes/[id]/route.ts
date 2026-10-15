import { NextResponse } from "next/server";

import { optionalString, readJson, stringArray, withAuth } from "@/lib/api/route";
import { deleteNote, updateNote } from "@/lib/notes";

type Context = { params: Promise<{ id: string }> };

export const PATCH = withAuth(
  "Erro ao atualizar anotação.",
  async (request: Request, { params }: Context) => {
    const { id } = await params;
    const body = await readJson(request);
    const note = await updateNote(id, {
      title: optionalString(body.title),
      content: optionalString(body.content),
      tags: body.tags === null ? null : stringArray(body.tags),
      is_pinned: typeof body.is_pinned === "boolean" ? body.is_pinned : undefined,
      pinned_position:
        body.pinned_position === null || typeof body.pinned_position === "number"
          ? body.pinned_position
          : undefined,
    });
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
