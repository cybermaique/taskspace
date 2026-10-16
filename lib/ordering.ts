import type { Task, TaskStatus } from "@/types/task";

/** True when `ordered` contains exactly the ids in `current`, each once. */
export function isSamePermutation(current: Iterable<string>, ordered: string[]) {
  const expected = new Set(current);
  const received = new Set(ordered);
  return (
    received.size === ordered.length &&
    received.size === expected.size &&
    ordered.every((id) => expected.has(id))
  );
}

export interface TaskMovePlan {
  /** Every task in its new global order, positions rewritten to match. */
  tasks: Task[];
  statusChanged: boolean;
  orderChanged: boolean;
}

/**
 * Moves a task into `status`, placing it right before `beforeId` in the global
 * order. With no `beforeId` it goes after the last task already in that column,
 * so hidden (filtered-out) tasks keep their relative order.
 */
export function planTaskMove(
  ordered: Task[],
  taskId: string,
  status: TaskStatus,
  beforeId: string | null,
): TaskMovePlan | null {
  const moving = ordered.find((task) => task.id === taskId);
  if (!moving) return null;

  const rest = ordered.filter((task) => task.id !== taskId);
  let insertAt = beforeId ? rest.findIndex((task) => task.id === beforeId) : -1;
  if (insertAt === -1) {
    const lastInColumn = rest.findLastIndex((task) => task.status === status);
    insertAt = lastInColumn === -1 ? rest.length : lastInColumn + 1;
  }

  const statusChanged = moving.status !== status;
  const moved: Task = statusChanged
    ? {
        ...moving,
        status,
        completed_at: status === "completed" ? new Date().toISOString() : null,
      }
    : moving;
  rest.splice(insertAt, 0, moved);

  const orderChanged = rest.some((task, index) => ordered[index]?.id !== task.id);
  if (!statusChanged && !orderChanged) return null;

  return {
    tasks: rest.map((task, position) => ({ ...task, position })),
    statusChanged,
    orderChanged,
  };
}

export type BoardColumns = Record<TaskStatus, string[]>;

/**
 * Where a dragged card lands. `overId` is either a card or a column id; when it
 * is a card in another column, `isBelowOver` decides whether it goes after it.
 */
export function resolveDrop(
  columns: BoardColumns,
  activeId: string,
  overId: string,
  isBelowOver: boolean,
): { status: TaskStatus; beforeId: string | null } | null {
  const statuses = Object.keys(columns) as TaskStatus[];
  const containerOf = (id: string) =>
    statuses.includes(id as TaskStatus)
      ? (id as TaskStatus)
      : statuses.find((status) => columns[status].includes(id));

  const from = containerOf(activeId);
  const to = containerOf(overId);
  if (!from || !to) return null;

  // Dropped on the column itself (empty area): append to its end.
  if (overId === to) {
    return from === to && columns[to].at(-1) === activeId ? null : { status: to, beforeId: null };
  }

  let items: string[];
  if (from === to) {
    const oldIndex = columns[to].indexOf(activeId);
    const newIndex = columns[to].indexOf(overId);
    if (oldIndex === newIndex) return null;
    items = [...columns[to]];
    items.splice(oldIndex, 1);
    items.splice(newIndex, 0, activeId);
  } else {
    items = [...columns[to]];
    items.splice(items.indexOf(overId) + (isBelowOver ? 1 : 0), 0, activeId);
  }

  return { status: to, beforeId: items[items.indexOf(activeId) + 1] ?? null };
}
