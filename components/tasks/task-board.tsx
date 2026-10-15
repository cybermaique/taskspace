"use client";

import { memo, useMemo, useRef, useState } from "react";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus } from "lucide-react";

import { QuickAdd } from "@/components/tasks/quick-add";
import { TaskCard } from "@/components/tasks/task-card";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { useWorkspaceActions, useWorkspaceUI } from "@/components/workspace/workspace-provider";
import { STATUS_META } from "@/lib/task-meta";
import { cn } from "@/lib/utils";
import { TASK_STATUSES, type CreateTaskInput, type Task, type TaskStatus } from "@/types/task";

type Columns = Record<TaskStatus, string[]>;

const COLLAPSED_LIMIT = 15;

function buildColumns(tasks: Task[]): Columns {
  const columns: Columns = { not_started: [], in_progress: [], waiting: [], completed: [] };
  for (const task of tasks) columns[task.status].push(task.id);
  return columns;
}

function findContainer(id: UniqueIdentifier, columns: Columns): TaskStatus | undefined {
  if (TASK_STATUSES.includes(id as TaskStatus)) return id as TaskStatus;
  return TASK_STATUSES.find((status) => columns[status].includes(String(id)));
}

const SortableTaskCard = memo(function SortableTaskCard({
  task,
  compact,
  onOpen,
}: {
  task: Task;
  compact: boolean;
  onOpen: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  return (
    <TaskCard
      ref={setNodeRef}
      task={task}
      compact={compact}
      dragging={isDragging}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onKeyDown={(event) => {
        listeners?.onKeyDown?.(event);
        if (event.key === "Enter" && event.target === event.currentTarget) onOpen(task.id);
      }}
      onOpen={() => onOpen(task.id)}
    />
  );
});

function BoardColumn({
  status,
  ids,
  tasksById,
  compact,
  defaults,
  onOpen,
}: {
  status: TaskStatus;
  ids: string[];
  tasksById: Map<string, Task>;
  compact: boolean;
  defaults: Partial<CreateTaskInput>;
  onOpen: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const { openCreateTask } = useWorkspaceUI();
  const [expanded, setExpanded] = useState(false);
  const meta = STATUS_META[status];
  const collapsible = status === "completed" && ids.length > COLLAPSED_LIMIT;
  const visibleIds = collapsible && !expanded ? ids.slice(0, COLLAPSED_LIMIT) : ids;

  return (
    <section
      className="flex w-[min(85vw,20rem)] shrink-0 snap-start flex-col lg:w-auto lg:min-w-60 lg:flex-1"
      aria-label={meta.label}
    >
      <header className="flex h-9 items-center gap-2 px-1">
        <meta.icon className={cn("size-4", meta.tone)} />
        <h2 className="text-sm font-medium">{meta.label}</h2>
        <span className="text-xs text-muted-foreground tabular-nums">{ids.length}</span>
        <Tooltip content={`Nova tarefa em ${meta.label}`}>
          <Button
            variant="ghost"
            size="icon-xs"
            className="ml-auto"
            aria-label={`Nova tarefa em ${meta.label}`}
            onClick={() => openCreateTask(status)}
          >
            <Plus />
          </Button>
        </Tooltip>
      </header>

      <div
        ref={setNodeRef}
        className={cn(
          "mt-1 flex min-h-32 flex-1 flex-col gap-2 rounded-2xl p-1.5 transition-colors",
          isOver ? "bg-brand-soft ring-2 ring-primary/25" : "bg-subtle/70 ring-1 ring-border/60",
        )}
      >
        <SortableContext items={visibleIds} strategy={verticalListSortingStrategy}>
          {visibleIds.map((id) => {
            const task = tasksById.get(id);
            return task ? (
              <SortableTaskCard key={id} task={task} compact={compact} onOpen={onOpen} />
            ) : null;
          })}
        </SortableContext>

        {ids.length === 0 ? (
          <p className="grid flex-1 place-items-center rounded-xl border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
            Solte uma tarefa aqui
          </p>
        ) : null}

        {collapsible ? (
          <Button variant="ghost" size="sm" onClick={() => setExpanded((value) => !value)}>
            {expanded ? "Mostrar menos" : `Mostrar mais ${ids.length - COLLAPSED_LIMIT}`}
          </Button>
        ) : null}

        {status !== "completed" ? <QuickAdd status={status} defaults={defaults} /> : null}
      </div>
    </section>
  );
}

export function TaskBoard({
  tasks,
  compact,
  defaults,
}: {
  tasks: Task[];
  compact: boolean;
  defaults: Partial<CreateTaskInput>;
}) {
  const actions = useWorkspaceActions();
  const { openTask } = useWorkspaceUI();
  const tasksById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const baseColumns = useMemo(() => buildColumns(tasks), [tasks]);
  const [dragColumns, setDragColumns] = useState<Columns | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const lastDragEndRef = useRef(0);
  const columns = dragColumns ?? baseColumns;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space"] },
    }),
  );

  const handleOpen = useMemo(
    () => (id: string) => {
      // A drag that ends over its own card would otherwise also count as a click.
      if (Date.now() - lastDragEndRef.current < 250) return;
      openTask(id);
    },
    [openTask],
  );

  const reset = () => {
    setActiveId(null);
    setDragColumns(null);
    lastDragEndRef.current = Date.now();
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id));
    setDragColumns(baseColumns);
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    setDragColumns((previous) => {
      const current = previous ?? baseColumns;
      const from = findContainer(active.id, current);
      const to = findContainer(over.id, current);
      if (!from || !to || from === to) return previous;

      const target = current[to].filter((id) => id !== active.id);
      const overIndex = target.indexOf(String(over.id));
      const translated = active.rect.current.translated;
      const isBelow = translated ? translated.top > over.rect.top + over.rect.height / 2 : false;
      const index = overIndex >= 0 ? overIndex + (isBelow ? 1 : 0) : target.length;
      target.splice(index, 0, String(active.id));

      return {
        ...current,
        [from]: current[from].filter((id) => id !== active.id),
        [to]: target,
      };
    });
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const current = dragColumns ?? baseColumns;
    const container = findContainer(active.id, current);
    reset();
    if (!over || !container) return;

    let items = current[container];
    if (findContainer(over.id, current) === container) {
      const oldIndex = items.indexOf(String(active.id));
      const newIndex = items.indexOf(String(over.id));
      if (newIndex >= 0 && oldIndex !== newIndex) items = arrayMove(items, oldIndex, newIndex);
    }
    const index = items.indexOf(String(active.id));
    actions.moveTask(String(active.id), container, items[index + 1] ?? null);
  };

  const activeTask = activeId ? tasksById.get(activeId) : undefined;

  return (
    <DndContext
      id="task-board"
      sensors={sensors}
      collisionDetection={closestCorners}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={reset}
      accessibility={{
        screenReaderInstructions: {
          draggable:
            "Para mover uma tarefa, pressione espaço. Use as setas para mudar de posição ou coluna e espaço para soltar. Esc cancela.",
        },
      }}
    >
      <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:snap-none lg:px-0">
        {TASK_STATUSES.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            ids={columns[status]}
            tasksById={tasksById}
            compact={compact}
            defaults={defaults}
            onOpen={handleOpen}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }}>
        {activeTask ? <TaskCard task={activeTask} compact={compact} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
