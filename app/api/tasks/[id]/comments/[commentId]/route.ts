import { NextResponse } from "next/server";

import { withAuth } from "@/lib/api/route";
import { deleteTaskComment } from "@/lib/tasks";

type Context = { params: Promise<{ id: string; commentId: string }> };

export const DELETE = withAuth(
  "Não foi possível excluir o comentário.",
  async (_request: Request, { params }: Context) => {
    const { id, commentId } = await params;
    return NextResponse.json({ task: await deleteTaskComment(id, commentId) });
  },
);
