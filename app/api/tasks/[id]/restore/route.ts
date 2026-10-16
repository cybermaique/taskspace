import { NextResponse } from "next/server";

import { withAuth } from "@/lib/api/route";
import { restoreTask } from "@/lib/tasks";

type Context = { params: Promise<{ id: string }> };

export const POST = withAuth(
  "Erro ao restaurar tarefa.",
  async (_request: Request, { params }: Context) => {
    const { id } = await params;
    return NextResponse.json({ task: await restoreTask(id) });
  },
);
