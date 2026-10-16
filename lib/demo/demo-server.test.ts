import { beforeEach, describe, expect, it } from "vitest";

import { createDemoServer, DemoHttpError } from "@/lib/demo/demo-server";
import { createDemoState, type DemoState } from "@/lib/demo/seed";
import type { Note } from "@/types/note";
import type { Task } from "@/types/task";

let state: DemoState;
let server: ReturnType<typeof createDemoServer>;

const request = <T>(method: string, url: string, body?: unknown) => server.handle(method, url, body) as T;
const createTask = (body: Record<string, unknown>) =>
  request<{ task: Task }>("POST", "/api/tasks", body).task;

beforeEach(() => {
  state = createDemoState(Date.UTC(2026, 9, 15));
  server = createDemoServer(state);
});

describe("demo server: tasks", () => {
  it("creates a task at the top with history and subtasks", () => {
    const created = createTask({ title: "  Nova  ", subtasks: ["Passo 1", " "], status: "in_progress" });

    expect(created.title).toBe("Nova");
    expect(created.subtasks.map((subtask) => subtask.title)).toEqual(["Passo 1"]);
    expect(created.status_history).toHaveLength(1);
    expect(created.position).toBeLessThan(Math.min(...state.tasks.filter((t) => t.id !== created.id).map((t) => t.position)));
  });

  it("rejects invalid input with a 400 and a readable message", () => {
    expect(() => createTask({ title: "" })).toThrow(DemoHttpError);
    expect(() => createTask({ title: "" })).toThrow("Informe um título para a tarefa.");
    expect(() => createTask({ title: "Ok", priority: "urgent" })).toThrow(/priority/);
  });

  it("records status and description history like the database triggers", () => {
    const { id } = createTask({ title: "Histórico" });

    request("PATCH", `/api/tasks/${id}`, { status: "completed" });
    const { task } = request<{ task: Task }>("PATCH", `/api/tasks/${id}`, { description: "v2" });

    expect(task.status_history.map((event) => event.to_status)).toEqual(["not_started", "completed"]);
    expect(task.completed_at).not.toBeNull();
    expect(task.description).toBe("v2");
    expect(task.description_history[0]?.description).toBeNull();
  });

  it("restores a previous description and keeps the current one in history", () => {
    const { id } = createTask({ title: "Restaurar", description: "v1" });
    const { task } = request<{ task: Task }>("PATCH", `/api/tasks/${id}`, { description: "v2" });
    const revision = task.description_history[0];

    const restored = request<{ task: Task }>(
      "POST",
      `/api/tasks/${id}/description-history/${revision.id}/restore`,
    ).task;

    expect(restored.description).toBe("v1");
    expect(restored.description_history[0]?.description).toBe("v2");
  });

  it("validates reorder payloads against the current tasks", () => {
    const liveIds = state.tasks.map((task) => task.id);

    request("POST", "/api/tasks/reorder", { task_ids: [...liveIds].reverse() });
    expect(state.tasks.find((task) => task.id === liveIds.at(-1))?.position).toBe(0);

    expect(() => request("POST", "/api/tasks/reorder", { task_ids: liveIds.slice(1) })).toThrow(
      "A ordem das tarefas está desatualizada",
    );
  });

  it("moves deleted tasks to the trash and restores them", () => {
    const { id } = createTask({ title: "Lixo" });
    request("DELETE", `/api/tasks/${id}`);

    const trash = request<{ tasks: Task[] }>("GET", "/api/trash");
    expect(trash.tasks.map((task) => task.id)).toContain(id);

    request("POST", `/api/tasks/${id}/restore`);
    expect(request<{ tasks: Task[] }>("GET", "/api/trash").tasks).toHaveLength(0);
  });

  it("toggles and reorders subtasks", () => {
    const created = createTask({ title: "Subtarefas", subtasks: ["a", "b"] });
    const [first, second] = created.subtasks;

    const toggled = request<{ task: Task }>("PATCH", `/api/subtasks/${first.id}`, { is_completed: true }).task;
    expect(toggled.subtasks[0].completed_at).not.toBeNull();

    const reordered = request<{ task: Task }>("POST", `/api/tasks/${created.id}/subtasks/reorder`, {
      subtask_ids: [second.id, first.id],
    }).task;
    expect(reordered.subtasks.map((subtask) => subtask.title)).toEqual(["b", "a"]);
  });

  it("refuses attachments in the demo", () => {
    const { id } = createTask({ title: "Anexo" });
    expect(() => request("POST", `/api/tasks/${id}/attachments`)).toThrow("Anexos ficam desativados");
  });
});

describe("demo server: notes and profile", () => {
  it("creates, pins and reorders notes", () => {
    const { note } = request<{ note: Note }>("POST", "/api/notes", { title: "Ideia", content: "#tag" });
    request("PATCH", `/api/notes/${note.id}`, { is_pinned: true, pinned_position: 5 });

    const pinnedIds = state.notes.filter((item) => item.is_pinned).map((item) => item.id);
    request("POST", "/api/notes/reorder", { noteIds: [note.id, ...pinnedIds.filter((id) => id !== note.id)] });

    expect(state.notes.find((item) => item.id === note.id)?.pinned_position).toBe(0);
  });

  it("updates only allowed profile fields", () => {
    const { profile } = request<{ profile: DemoState["profile"] }>("PATCH", "/api/profile", {
      nickname: "Ana",
      accent_color: "rose",
    });
    expect(profile).toMatchObject({ nickname: "Ana", accent_color: "rose" });
    expect(() => request("PATCH", "/api/profile", { accent_color: "neon" })).toThrow(DemoHttpError);
  });

  it("returns 404 for unknown routes", () => {
    expect(() => request("GET", "/api/nope")).toThrow(/Rota não encontrada/);
  });
});
