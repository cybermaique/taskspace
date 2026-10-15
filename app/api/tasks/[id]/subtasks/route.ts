import { NextResponse } from "next/server";

import { badRequest, optionalString, readJson, withAuth } from "@/lib/api/route";
import { createSubtask } from "@/lib/tasks";

type Context = { params: Promise<{ id: string }> };

export const POST = withAuth(
  "Não foi possível criar a subtarefa.",
  async (request: Request, { params }: Context) => {
    const { id } = await params;
    const title = optionalString((await readJson(request)).title)?.trim();
    if (!title) badRequest("Informe o título da subtarefa.");
    return NextResponse.json({ task: await createSubtask(id, title) }, { status: 201 });
  },
);
