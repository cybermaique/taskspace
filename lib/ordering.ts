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
