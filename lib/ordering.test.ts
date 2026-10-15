import { describe, expect, it } from "vitest";

import { isSamePermutation, planTaskMove } from "@/lib/ordering";
import type { Task, TaskStatus } from "@/types/task";

function task(id: string, status: TaskStatus, position: number): Task {
  return {
    id,
    title: id,
    description: null,
    status,
    priority: "medium",
    type: "feature",
    category: null,
    position,
    deleted_at: null,
    created_at: "2026-01-01T00:00:00.000Z",
    completed_at: status === "completed" ? "2026-01-02T00:00:00.000Z" : null,
    updated_at: "2026-01-01T00:00:00.000Z",
    attachments: [],
    subtasks: [],
    status_history: [],
    description_history: [],
    comments: [],
  };
}

// Global order: a(todo) b(todo) c(doing) d(todo) e(done)
const board = [
  task("a", "not_started", 0),
  task("b", "not_started", 1),
  task("c", "in_progress", 2),
  task("d", "not_started", 3),
  task("e", "completed", 4),
];
const ids = (tasks: Task[]) => tasks.map((item) => item.id);

describe("isSamePermutation", () => {
  it("accepts the same ids in any order", () => {
    expect(isSamePermutation(["a", "b", "c"], ["c", "a", "b"])).toBe(true);
  });

  it("rejects missing, extra or duplicated ids", () => {
    expect(isSamePermutation(["a", "b"], ["a"])).toBe(false);
    expect(isSamePermutation(["a", "b"], ["a", "b", "c"])).toBe(false);
    expect(isSamePermutation(["a", "b"], ["a", "a"])).toBe(false);
  });
});

describe("planTaskMove", () => {
  it("reorders inside a column and rewrites positions", () => {
    const plan = planTaskMove(board, "d", "not_started", "a");

    expect(plan).not.toBeNull();
    expect(ids(plan!.tasks)).toEqual(["d", "a", "b", "c", "e"]);
    expect(plan!.tasks.map((item) => item.position)).toEqual([0, 1, 2, 3, 4]);
    expect(plan!.statusChanged).toBe(false);
    expect(plan!.orderChanged).toBe(true);
  });

  it("moves to another column before a target task", () => {
    const plan = planTaskMove(board, "a", "in_progress", "c");

    expect(ids(plan!.tasks)).toEqual(["b", "a", "c", "d", "e"]);
    expect(plan!.tasks.find((item) => item.id === "a")?.status).toBe("in_progress");
    expect(plan!.statusChanged).toBe(true);
  });

  it("drops after the last task of the column when there is no target", () => {
    const plan = planTaskMove(board, "e", "not_started", null);

    // "d" is the last not_started task, so "e" lands right after it.
    expect(ids(plan!.tasks)).toEqual(["a", "b", "c", "d", "e"]);
    expect(plan!.statusChanged).toBe(true);
    expect(plan!.orderChanged).toBe(false);
  });

  it("appends to the end when the target column is empty", () => {
    const plan = planTaskMove(board, "b", "waiting", null);
    expect(ids(plan!.tasks)).toEqual(["a", "c", "d", "e", "b"]);
  });

  it("sets and clears completed_at with the status", () => {
    const completed = planTaskMove(board, "a", "completed", null);
    expect(completed!.tasks.find((item) => item.id === "a")?.completed_at).toEqual(expect.any(String));

    const reopened = planTaskMove(board, "e", "in_progress", null);
    expect(reopened!.tasks.find((item) => item.id === "e")?.completed_at).toBeNull();
  });

  it("returns null when nothing changes or the task is unknown", () => {
    expect(planTaskMove(board, "b", "not_started", "c")).toBeNull();
    expect(planTaskMove(board, "missing", "completed", null)).toBeNull();
  });

  it("does not mutate the input", () => {
    const snapshot = structuredClone(board);
    planTaskMove(board, "a", "completed", null);
    expect(board).toEqual(snapshot);
  });
});
