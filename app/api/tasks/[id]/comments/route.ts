import { NextResponse } from "next/server";

import { optionalString, readJson, withAuth } from "@/lib/api/route";
import { createTaskComment } from "@/lib/tasks";

type Context = { params: Promise<{ id: string }> };

export const POST = withAuth(
  "Não foi possível adicionar o comentário.",
  async (request: Request, { params }: Context) => {
    const { id } = await params;
    const content = optionalString((await readJson(request)).content) ?? "";
    return NextResponse.json(
      { task: await createTaskComment(id, content) },
      { status: 201 },
    );
  },
);
