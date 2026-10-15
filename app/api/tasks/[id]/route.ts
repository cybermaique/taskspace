import { NextResponse } from "next/server";

import { nullableString, optionalString, readJson, withAuth } from "@/lib/api/route";
import { deleteTask, updateTask } from "@/lib/tasks";
import { isTaskPriority, isTaskStatus, isTaskType } from "@/types/task";

type Context = { params: Promise<{ id: string }> };

export const PATCH = withAuth(
  "Erro ao atualizar tarefa.",
  async (request: Request, { params }: Context) => {
    const { id } = await params;
    const body = await readJson(request);

    const task = await updateTask(id, {
      title: optionalString(body.title),
      description: nullableString(body.description),
      status: isTaskStatus(body.status) ? body.status : undefined,
      priority: isTaskPriority(body.priority) ? body.priority : undefined,
      type: isTaskType(body.type) ? body.type : undefined,
      category: nullableString(body.category),
    });

    return NextResponse.json({ task });
  },
);

export const DELETE = withAuth(
  "Erro ao excluir tarefa.",
  async (_request: Request, { params }: Context) => {
    const { id } = await params;
    await deleteTask(id);
    return NextResponse.json({ success: true });
  },
);
