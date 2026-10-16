import type { Task } from "@/types/task";

let sequence = 0;

/** Builds a valid Task with sensible defaults; override only what a test cares about. */
export function makeTask(overrides: Partial<Task> = {}): Task {
  sequence += 1;
  const status = overrides.status ?? "not_started";
  return {
    id: `task-${sequence}`,
    title: `Tarefa ${sequence}`,
    description: null,
    status,
    priority: "medium",
    type: "feature",
    category: "trabalho",
    position: sequence,
    deleted_at: null,
    created_at: "2026-01-10T12:00:00.000Z",
    completed_at: status === "completed" ? "2026-01-11T12:00:00.000Z" : null,
    updated_at: "2026-01-10T12:00:00.000Z",
    attachments: [],
    subtasks: [],
    status_history: [],
    description_history: [],
    comments: [],
    ...overrides,
  };
}
