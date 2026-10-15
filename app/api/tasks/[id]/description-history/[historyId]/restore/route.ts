import { NextResponse } from "next/server";

import { withAuth } from "@/lib/api/route";
import { restoreTaskDescription } from "@/lib/tasks";

type Context = { params: Promise<{ id: string; historyId: string }> };

export const POST = withAuth(
  "Não foi possível restaurar a descrição.",
  async (_request: Request, { params }: Context) => {
    const { id, historyId } = await params;
    return NextResponse.json({ task: await restoreTaskDescription(id, historyId) });
  },
);
