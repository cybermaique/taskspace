"use client";

import { useState } from "react";

import { Workspace } from "@/components/workspace/workspace";
import { WorkspaceSkeleton } from "@/components/workspace/workspace-skeleton";
import { createDemoTransport, loadDemoState } from "@/lib/demo/demo-transport";
import { useHydrated } from "@/lib/use-hydrated";

function DemoWorkspaceClient() {
  // Created once per visit; the state object is mutated by the demo server.
  const [{ state, transport }] = useState(() => {
    const demoState = loadDemoState();
    return { state: demoState, transport: createDemoTransport(demoState) };
  });

  return (
    <Workspace
      initialTasks={state.tasks.filter((task) => !task.deleted_at)}
      initialNotes={state.notes.filter((note) => !note.deleted_at)}
      initialProfile={state.profile}
      initialView="tasks"
      initialTaskId={null}
      email={null}
      transport={transport}
    />
  );
}

export function DemoWorkspace() {
  // Demo data lives in the browser, so render only after hydration.
  const hydrated = useHydrated();
  return hydrated ? <DemoWorkspaceClient /> : <WorkspaceSkeleton />;
}
