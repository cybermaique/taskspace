import { NextResponse } from "next/server";

import { parseJson, withAuth } from "@/lib/api/route";
import { reorderNotesSchema } from "@/lib/api/schemas";
import { reorderPinnedNotes } from "@/lib/notes";

export const POST = withAuth(
  "Erro ao reordenar anotações fixadas.",
  async (request: Request) => {
    const { noteIds } = await parseJson(request, reorderNotesSchema);
    await reorderPinnedNotes(noteIds);
    return NextResponse.json({ success: true });
  },
);
