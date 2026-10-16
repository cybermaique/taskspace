import { NextResponse } from "next/server";

import { parseJson, withAuth } from "@/lib/api/route";
import { reorderSubtasksSchema } from "@/lib/api/schemas";
import { reorderSubtasks } from "@/lib/tasks";

type Context = { params: Promise<{ id: string }> };

export const POST = withAuth(
  "Não foi possível reordenar as subtarefas.",
  async (request: Request, { params }: Context) => {
    const { id } = await params;
    const { subtask_ids } = await parseJson(request, reorderSubtasksSchema);
    return NextResponse.json({ task: await reorderSubtasks(id, subtask_ids) });
  },
);
