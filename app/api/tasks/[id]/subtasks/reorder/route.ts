import { NextResponse } from "next/server";

import { badRequest, readJson, stringArray, withAuth } from "@/lib/api/route";
import { reorderSubtasks } from "@/lib/tasks";

type Context = { params: Promise<{ id: string }> };

export const POST = withAuth(
  "Não foi possível reordenar as subtarefas.",
  async (request: Request, { params }: Context) => {
    const { id } = await params;
    const subtaskIds = stringArray((await readJson(request)).subtask_ids);
    if (!subtaskIds) badRequest("Informe a nova ordem das subtarefas.");
    return NextResponse.json({ task: await reorderSubtasks(id, subtaskIds) });
  },
);
