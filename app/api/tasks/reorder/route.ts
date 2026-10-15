import { NextResponse } from "next/server";

import { parseJson, withAuth } from "@/lib/api/route";
import { reorderTasksSchema } from "@/lib/api/schemas";
import { reorderTasks } from "@/lib/tasks";

export const POST = withAuth(
  "Não foi possível ordenar as tarefas.",
  async (request: Request) => {
    const { task_ids } = await parseJson(request, reorderTasksSchema);
    await reorderTasks(task_ids);
    return NextResponse.json({ success: true });
  },
);
