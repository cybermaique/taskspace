// @vitest-environment happy-dom
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { taskMatchesQuery, useTaskFilters } from "@/components/tasks/use-task-filters";
import { makeTask } from "@/test/factories";

const tasks = [
  makeTask({ title: "Corrigir login", category: "trabalho", priority: "high", created_at: "2026-02-01T12:00:00.000Z" }),
  makeTask({ title: "Viagem para Lisboa", category: "pessoal", type: "travel", created_at: "2026-02-10T12:00:00.000Z" }),
  makeTask({
    title: "Estudar RSC",
    category: "pessoal",
    type: "study",
    subtasks: [
      {
        id: "s1",
        task_id: "x",
        title: "Ler documentação",
        is_completed: false,
        completed_at: null,
        position: 0,
        created_at: "",
        updated_at: "",
      },
    ],
  }),
];

beforeEach(() => window.localStorage.clear());

describe("taskMatchesQuery", () => {
  it("matches every word, ignoring case, in title, description and subtasks", () => {
    expect(taskMatchesQuery(tasks[0], "LOGIN corrigir")).toBe(true);
    expect(taskMatchesQuery(tasks[2], "documentação")).toBe(true);
    expect(taskMatchesQuery(tasks[0], "login lisboa")).toBe(false);
  });
});

describe("useTaskFilters", () => {
  it("filters by scope, priority and creation range", () => {
    const { result } = renderHook(() => useTaskFilters(tasks));
    expect(result.current.filtered).toHaveLength(3);

    act(() => result.current.setFilter("scope", "personal"));
    expect(result.current.filtered.map((task) => task.title)).toEqual(["Viagem para Lisboa", "Estudar RSC"]);

    act(() => result.current.setFilter("scope", "all"));
    act(() => result.current.setFilter("priority", "high"));
    expect(result.current.filtered.map((task) => task.title)).toEqual(["Corrigir login"]);

    act(() => result.current.reset());
    act(() => result.current.setRange("2026-02-05", "2026-02-15"));
    expect(result.current.filtered.map((task) => task.title)).toEqual(["Viagem para Lisboa"]);
    expect(result.current.activeCount).toBe(1);
  });

  it("remembers the layout per device", () => {
    const { result, unmount } = renderHook(() => useTaskFilters(tasks));
    act(() => result.current.setLayout("list"));
    unmount();

    const { result: next } = renderHook(() => useTaskFilters(tasks));
    expect(next.current.layout).toBe("list");
  });
});
