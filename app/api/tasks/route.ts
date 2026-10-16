import { NextResponse } from "next/server";

import { parseJson, withAuth } from "@/lib/api/route";
import { createTaskSchema } from "@/lib/api/schemas";
import { createTask, listTasks } from "@/lib/tasks";

export const GET = withAuth("Erro ao listar tarefas.", async () =>
  NextResponse.json({ tasks: await listTasks() }),
);

export const POST = withAuth("Erro ao criar tarefa.", async (request: Request) => {
  const task = await createTask(await parseJson(request, createTaskSchema));
  return NextResponse.json({ task }, { status: 201 });
});
