import { NextResponse } from "next/server";

import { withAuth } from "@/lib/api/route";
import { listTrashedNotes } from "@/lib/notes";
import { listTrashedTasks } from "@/lib/tasks";

export const GET = withAuth("Não foi possível abrir a lixeira.", async () => {
  const [tasks, notes] = await Promise.all([listTrashedTasks(), listTrashedNotes()]);
  return NextResponse.json({ tasks, notes });
});
