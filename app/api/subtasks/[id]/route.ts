import { NextResponse } from "next/server";

import { optionalString, readJson, withAuth } from "@/lib/api/route";
import { deleteSubtask, updateSubtask } from "@/lib/tasks";

type Context = { params: Promise<{ id: string }> };

export const PATCH = withAuth(
  "Erro ao atualizar subtarefa.",
  async (request: Request, { params }: Context) => {
    const { id } = await params;
    const body = await readJson(request);
    const task = await updateSubtask(id, {
      title: optionalString(body.title),
      is_completed: typeof body.is_completed === "boolean" ? body.is_completed : undefined,
    });
    return NextResponse.json({ task });
  },
);

export const DELETE = withAuth(
  "Erro ao excluir subtarefa.",
  async (_request: Request, { params }: Context) => {
    const { id } = await params;
    return NextResponse.json({ task: await deleteSubtask(id) });
  },
);
