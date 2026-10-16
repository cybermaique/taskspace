import { NextResponse } from "next/server";

import { parseJson, withAuth } from "@/lib/api/route";
import { createCommentSchema } from "@/lib/api/schemas";
import { createTaskComment } from "@/lib/tasks";

type Context = { params: Promise<{ id: string }> };

export const POST = withAuth(
  "Não foi possível adicionar o comentário.",
  async (request: Request, { params }: Context) => {
    const { id } = await params;
    const { content } = await parseJson(request, createCommentSchema);
    return NextResponse.json({ task: await createTaskComment(id, content) }, { status: 201 });
  },
);
