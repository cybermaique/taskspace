import { NextResponse } from "next/server";

import { parseJson, withAuth } from "@/lib/api/route";
import { createNoteSchema } from "@/lib/api/schemas";
import { createNote, listNotes } from "@/lib/notes";

export const GET = withAuth("Erro ao buscar anotações.", async () =>
  NextResponse.json({ notes: await listNotes() }),
);

export const POST = withAuth("Erro ao criar anotação.", async (request: Request) => {
  const note = await createNote(await parseJson(request, createNoteSchema));
  return NextResponse.json({ note }, { status: 201 });
});
