import { NextResponse } from "next/server";

import { parseJson, withAuth } from "@/lib/api/route";
import { updateTaskSchema } from "@/lib/api/schemas";
import { deleteTask, updateTask } from "@/lib/tasks";

type Context = { params: Promise<{ id: string }> };

export const PATCH = withAuth(
  "Erro ao atualizar tarefa.",
  async (request: Request, { params }: Context) => {
    const { id } = await params;
    const task = await updateTask(id, await parseJson(request, updateTaskSchema));

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
