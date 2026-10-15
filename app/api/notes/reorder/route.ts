import { NextResponse } from "next/server";

import { badRequest, readJson, stringArray, withAuth } from "@/lib/api/route";
import { reorderPinnedNotes } from "@/lib/notes";

export const POST = withAuth(
  "Erro ao reordenar anotações fixadas.",
  async (request: Request) => {
    const noteIds = stringArray((await readJson(request)).noteIds);
    if (!noteIds) badRequest("Informe a nova ordem das anotações.");
    await reorderPinnedNotes(noteIds);
    return NextResponse.json({ success: true });
  },
);
