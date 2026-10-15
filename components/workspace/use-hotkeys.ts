"use client";

import { useEffect } from "react";

import { NOTE_SEARCH_INPUT_ID } from "@/components/notes/notes-view";
import { TASK_SEARCH_INPUT_ID } from "@/components/tasks/task-toolbar";
import { useWorkspaceUI } from "@/components/workspace/workspace-provider";

function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || Boolean(target.closest("input, textarea, select, [role='combobox']")))
  );
}

export function useHotkeys() {
  const ui = useWorkspaceUI();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        ui.setPaletteOpen(!ui.paletteOpen);
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
      // Single-key shortcuts only apply when nothing modal is open.
      if (document.querySelector("[role='dialog'][data-open], [role='menu']")) return;

      switch (event.key) {
        case "c":
        case "C":
          event.preventDefault();
          if (ui.view === "tasks") ui.openCreateTask();
          else ui.setNoteEditor({ mode: "create" });
          break;
        case "/": {
          const input = document.getElementById(ui.view === "tasks" ? TASK_SEARCH_INPUT_ID : NOTE_SEARCH_INPUT_ID);
          if (input) {
            event.preventDefault();
            input.focus();
          }
          break;
        }
        case "1":
          ui.setView("tasks");
          break;
        case "2":
          ui.setView("notes");
          break;
        case "?":
          ui.setShortcutsOpen(true);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [ui]);
}
