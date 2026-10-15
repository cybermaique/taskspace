"use client";

import { NoteEditorDialog } from "@/components/notes/note-editor-dialog";
import { NotesView } from "@/components/notes/notes-view";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { TaskSheet } from "@/components/tasks/task-sheet";
import { TasksView } from "@/components/tasks/tasks-view";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/workspace/app-shell";
import { CommandPalette } from "@/components/workspace/command-palette";
import { SettingsDialog } from "@/components/workspace/settings-dialog";
import { ShortcutsDialog } from "@/components/workspace/shortcuts-dialog";
import { TrashDialog } from "@/components/workspace/trash-dialog";
import { useHotkeys } from "@/components/workspace/use-hotkeys";
import {
  useWorkspaceUI,
  WorkspaceProvider,
  type WorkspaceView,
} from "@/components/workspace/workspace-provider";
import type { Transport } from "@/lib/transport";
import type { Note } from "@/types/note";
import type { Profile } from "@/types/profile";
import type { Task } from "@/types/task";

function WorkspaceContent() {
  const { view } = useWorkspaceUI();
  useHotkeys();

  return (
    <AppShell>
      {view === "tasks" ? <TasksView /> : <NotesView />}
      <TaskSheet />
      <CreateTaskDialog />
      <NoteEditorDialog />
      <CommandPalette />
      <TrashDialog />
      <SettingsDialog />
      <ShortcutsDialog />
    </AppShell>
  );
}

export function Workspace(props: {
  initialTasks: Task[];
  initialNotes: Note[];
  initialProfile: Profile;
  initialView: WorkspaceView;
  initialTaskId: string | null;
  email: string | null;
  transport?: Transport;
}) {
  return (
    <TooltipProvider delay={400}>
      <WorkspaceProvider {...props}>
        <WorkspaceContent />
      </WorkspaceProvider>
    </TooltipProvider>
  );
}
