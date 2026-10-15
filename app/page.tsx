import { redirect } from "next/navigation";

import { Workspace } from "@/components/workspace/workspace";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { listNotes } from "@/lib/notes";
import { listTasks } from "@/lib/tasks";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; task?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [{ view, task }, tasks, notes, profile] = await Promise.all([
    searchParams,
    listTasks(),
    listNotes(),
    getCurrentProfile(),
  ]);

  if (!profile) {
    throw new Error("Não foi possível carregar seu perfil.");
  }

  return (
    <Workspace
      initialTasks={tasks}
      initialNotes={notes}
      initialProfile={profile}
      initialView={view === "notes" ? "notes" : "tasks"}
      initialTaskId={typeof task === "string" ? task : null}
      email={user.email ?? null}
    />
  );
}
