import { NextResponse } from "next/server";

import { badRequest, readJson, stringArray, withAuth } from "@/lib/api/route";
import { reorderTasks } from "@/lib/tasks";

export const POST = withAuth(
  "Não foi possível ordenar as tarefas.",
  async (request: Request) => {
    const taskIds = stringArray((await readJson(request)).task_ids);
    if (!taskIds?.length) badRequest("Informe a nova ordem das tarefas.");
    await reorderTasks(taskIds);
    return NextResponse.json({ success: true });
  },
);
