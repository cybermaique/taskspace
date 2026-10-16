import { NextResponse } from "next/server";

import { readFile, withAuth } from "@/lib/api/route";
import { createNoteAttachment } from "@/lib/notes";

type Context = { params: Promise<{ id: string }> };

export const POST = withAuth(
  "Não foi possível anexar o arquivo.",
  async (request: Request, { params }: Context) => {
    const { id } = await params;
    const file = await readFile(request);
    return NextResponse.json(
      { note: await createNoteAttachment(id, file) },
      { status: 201 },
    );
  },
);
