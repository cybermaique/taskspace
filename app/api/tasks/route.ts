import { NextResponse } from "next/server";

import {
  badRequest,
  nullableString,
  optionalString,
  readJson,
  stringArray,
  withAuth,
} from "@/lib/api/route";
import { createTask, listTasks } from "@/lib/tasks";
import { isTaskPriority, isTaskStatus, isTaskType } from "@/types/task";

export const GET = withAuth("Erro ao listar tarefas.", async () =>
  NextResponse.json({ tasks: await listTasks() }),
);

export const POST = withAuth("Erro ao criar tarefa.", async (request: Request) => {
  const body = await readJson(request);
  const title = optionalString(body.title)?.trim();
  if (!title) badRequest("Informe um título para a tarefa.");

  const task = await createTask({
    title: title.slice(0, 200),
    description: optionalString(body.description),
    status: isTaskStatus(body.status) ? body.status : undefined,
    priority: isTaskPriority(body.priority) ? body.priority : undefined,
    type: isTaskType(body.type) ? body.type : undefined,
    category: nullableString(body.category),
    subtasks: stringArray(body.subtasks),
    date_details: body.date_details as never,
  });

  return NextResponse.json({ task }, { status: 201 });
});
