import { NextResponse } from "next/server";

import { withAuth } from "@/lib/api/route";
import { restoreNote } from "@/lib/notes";

type Context = { params: Promise<{ id: string }> };

export const POST = withAuth(
  "Erro ao restaurar anotação.",
  async (_request: Request, { params }: Context) => {
    const { id } = await params;
    return NextResponse.json({ note: await restoreNote(id) });
  },
);
