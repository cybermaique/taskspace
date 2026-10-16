import { NextResponse } from "next/server";

import { readFile, withAuth } from "@/lib/api/route";
import { createTaskAttachment } from "@/lib/tasks";

type Context = { params: Promise<{ id: string }> };

export const POST = withAuth(
  "Não foi possível anexar o arquivo.",
  async (request: Request, { params }: Context) => {
    const { id } = await params;
    const file = await readFile(request);
    return NextResponse.json(
      { task: await createTaskAttachment(id, file) },
      { status: 201 },
    );
  },
);
