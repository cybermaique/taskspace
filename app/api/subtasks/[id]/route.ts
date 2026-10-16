import { NextResponse } from "next/server";

import { parseJson, withAuth } from "@/lib/api/route";
import { updateSubtaskSchema } from "@/lib/api/schemas";
import { deleteSubtask, updateSubtask } from "@/lib/tasks";

type Context = { params: Promise<{ id: string }> };

export const PATCH = withAuth(
  "Erro ao atualizar subtarefa.",
  async (request: Request, { params }: Context) => {
    const { id } = await params;
    const task = await updateSubtask(id, await parseJson(request, updateSubtaskSchema));
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
