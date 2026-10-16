import { NextResponse } from "next/server";

import { parseJson, withAuth } from "@/lib/api/route";
import { createSubtaskSchema } from "@/lib/api/schemas";
import { createSubtask } from "@/lib/tasks";

type Context = { params: Promise<{ id: string }> };

export const POST = withAuth(
  "Não foi possível criar a subtarefa.",
  async (request: Request, { params }: Context) => {
    const { id } = await params;
    const { title } = await parseJson(request, createSubtaskSchema);
    return NextResponse.json({ task: await createSubtask(id, title) }, { status: 201 });
  },
);
