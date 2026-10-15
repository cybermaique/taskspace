import { NextResponse } from "next/server";

import { optionalString, readJson, stringArray, withAuth } from "@/lib/api/route";
import { createNote, listNotes } from "@/lib/notes";

export const GET = withAuth("Erro ao buscar anotações.", async () =>
  NextResponse.json({ notes: await listNotes() }),
);

export const POST = withAuth("Erro ao criar anotação.", async (request: Request) => {
  const body = await readJson(request);
  const note = await createNote({
    title: optionalString(body.title) ?? "",
    content: optionalString(body.content) ?? "",
    tags: stringArray(body.tags) ?? null,
  });
  return NextResponse.json({ note }, { status: 201 });
});
