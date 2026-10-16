"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";

import type { Task, TaskPriority, TaskView } from "@/types/task";

export type TaskLayout = "board" | "list";

export interface TaskFilters {
  search: string;
  scope: TaskView;
  priority: TaskPriority | "all";
  from: string;
  to: string;
}

const STORAGE_KEY = "taskboard:task-prefs";
const DEFAULT_FILTERS: TaskFilters = { search: "", scope: "all", priority: "all", from: "", to: "" };

function readPrefs(): { layout?: TaskLayout; scope?: TaskView } {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function matchesScope(task: Task, scope: TaskView) {
  switch (scope) {
    case "work":
      return task.category === "trabalho";
    case "personal":
      return task.category === "pessoal";
    case "study":
      return task.type === "study";
    case "travel":
      return task.type === "travel";
    default:
      return true;
  }
}

function matchesRange(task: Task, from: string, to: string) {
  const createdAt = new Date(task.created_at).getTime();
  if (from && createdAt < new Date(`${from}T00:00:00`).getTime()) return false;
  if (to && createdAt >= new Date(`${to}T00:00:00`).getTime() + 86_400_000) return false;
  return true;
}

export function taskMatchesQuery(task: Task, query: string) {
  if (!query) return true;
  const haystack = [
    task.title,
    task.description ?? "",
    task.category ?? "",
    ...task.subtasks.map((subtask) => subtask.title),
  ]
    .join(" ")
    .toLocaleLowerCase("pt-BR");
  return query
    .toLocaleLowerCase("pt-BR")
    .split(/\s+/)
    .every((word) => haystack.includes(word));
}

export function useTaskFilters(tasks: Task[]) {
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);
  const [layout, setLayout] = useState<TaskLayout>("board");
  const [hydrated, setHydrated] = useState(false);
  const deferredSearch = useDeferredValue(filters.search.trim());

  useEffect(() => {
    const prefs = readPrefs();
    // Restoring per-device preferences after hydration avoids a server/client mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (prefs.layout === "board" || prefs.layout === "list") setLayout(prefs.layout);
    if (prefs.scope) setFilters((current) => ({ ...current, scope: prefs.scope as TaskView }));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ layout, scope: filters.scope }));
    } catch {
      // Storage may be unavailable (private mode); preferences just won't persist.
    }
  }, [filters.scope, hydrated, layout]);

  const filtered = useMemo(
    () =>
      tasks.filter(
        (task) =>
          matchesScope(task, filters.scope) &&
          (filters.priority === "all" || task.priority === filters.priority) &&
          matchesRange(task, filters.from, filters.to) &&
          taskMatchesQuery(task, deferredSearch),
      ),
    [deferredSearch, filters.from, filters.priority, filters.scope, filters.to, tasks],
  );

  const activeCount =
    (filters.search.trim() ? 1 : 0) +
    (filters.scope !== "all" ? 1 : 0) +
    (filters.priority !== "all" ? 1 : 0) +
    (filters.from || filters.to ? 1 : 0);

  return {
    filters,
    setFilter: <Key extends keyof TaskFilters>(key: Key, value: TaskFilters[Key]) =>
      setFilters((current) => ({ ...current, [key]: value })),
    setRange: (from: string, to: string) => setFilters((current) => ({ ...current, from, to })),
    reset: () => setFilters(DEFAULT_FILTERS),
    activeCount,
    filtered,
    layout,
    setLayout,
  };
}
