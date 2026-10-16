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
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
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
import { resolveDrop, type BoardColumns } from "@/lib/ordering";
import { STATUS_META } from "@/lib/task-meta";
import { cn } from "@/lib/utils";
import { TASK_STATUSES, type CreateTaskInput, type Task, type TaskStatus } from "@/types/task";
import { useI18n } from "@/components/i18n-provider";

const COLLAPSED_LIMIT = 15;

function buildColumns(tasks: Task[]): BoardColumns {
  const columns: BoardColumns = { not_started: [], in_progress: [], waiting: [], completed: [] };
  for (const task of tasks) columns[task.status].push(task.id);
  return columns;
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
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  return (
    <TaskCard
      ref={setNodeRef}
      task={task}
      compact={compact}
      dragging={isDragging}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      // Pointer listeners on the whole card; keyboard drag starts from the open button.
      {...listeners}
      openButtonRef={setActivatorNodeRef}
      openButtonProps={attributes}
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
  const { t } = useI18n();
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const { openCreateTask } = useWorkspaceUI();
  const [expanded, setExpanded] = useState(false);
  const meta = STATUS_META[status];
  const collapsible = status === "completed" && ids.length > COLLAPSED_LIMIT;
  const visibleIds = collapsible && !expanded ? ids.slice(0, COLLAPSED_LIMIT) : ids;

  return (
    <section
      className="flex w-[min(85vw,20rem)] shrink-0 snap-start flex-col lg:w-auto lg:min-w-60 lg:flex-1"
      aria-label={t(meta.label)}
    >
      <header className="flex h-9 items-center gap-2 px-1">
        <meta.icon className={cn("size-4", meta.tone)} />
        <h2 className="text-sm font-medium">{t(meta.label)}</h2>
        <span className="text-xs text-muted-foreground tabular-nums">{ids.length}</span>
        <Tooltip content={t("Nova tarefa em {status}", { status: t(meta.label) })}>
          <Button
            variant="ghost"
            size="icon-xs"
            className="ml-auto"
            aria-label={t("Nova tarefa em {status}", { status: t(meta.label) })}
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
          <p className="grid flex-1 place-items-center rounded-xl border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">{t("Solte uma tarefa aqui")}</p>
        ) : null}

        {collapsible ? (
          <Button variant="ghost" size="sm" onClick={() => setExpanded((value) => !value)}>
            {expanded ? t("Mostrar menos") : t("Mostrar mais {count}", { count: ids.length - COLLAPSED_LIMIT })}
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
  const { t } = useI18n();
  const actions = useWorkspaceActions();
  const { openTask } = useWorkspaceUI();
  const tasksById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const baseColumns = useMemo(() => buildColumns(tasks), [tasks]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const lastDragEndRef = useRef(0);

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
    lastDragEndRef.current = Date.now();
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id));
  };

  // Cards stay in their column while dragging (the overlay follows the pointer and
  // the target column highlights). Moving items between containers on every
  // dragover makes collision detection oscillate into an update loop.
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    reset();
    if (!over) return;
    const translated = active.rect.current.translated;
    const isBelow = translated ? translated.top > over.rect.top + over.rect.height / 2 : false;
    const drop = resolveDrop(baseColumns, String(active.id), String(over.id), isBelow);
    if (drop) actions.moveTask(String(active.id), drop.status, drop.beforeId);
  };

  const activeTask = activeId ? tasksById.get(activeId) : undefined;

  // Screen reader announcements use titles and column names, never raw ids.
  const title = (id: UniqueIdentifier) => `"${tasksById.get(String(id))?.title ?? t("tarefa")}"`;
  const describe = (id: UniqueIdentifier) => {
    const status = TASK_STATUSES.find((item) => item === id);
    if (status) return t("a coluna {status}", { status: t(STATUS_META[status].label) });
    const task = tasksById.get(String(id));
    return task ? t("{title}, na coluna {status}", { title: title(id), status: t(STATUS_META[task.status].label) }) : t("uma área");
  };

  return (
    <DndContext
      id="task-board"
      sensors={sensors}
      collisionDetection={closestCorners}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={reset}
      accessibility={{
        screenReaderInstructions: {
          draggable:
            t("Para mover uma tarefa, pressione espaço. Use as setas para mudar de posição ou coluna e espaço para soltar. Esc cancela."),
        },
        announcements: {
          onDragStart: ({ active }) => t("Tarefa {title} selecionada.", { title: title(active.id) }),
          onDragOver: ({ active, over }) =>
            over ? t("{title} sobre {area}.", { title: title(active.id), area: describe(over.id) }) : t("{title} fora de uma coluna.", { title: title(active.id) }),
          onDragEnd: ({ active, over }) =>
            over ? t("{title} solta em {area}.", { title: title(active.id), area: describe(over.id) }) : t("{title} solta.", { title: title(active.id) }),
          onDragCancel: ({ active }) => t("Movimento cancelado. {title} voltou ao lugar.", { title: title(active.id) }),
        },
      }}
    >
      <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:snap-none lg:px-0">
        {TASK_STATUSES.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            ids={baseColumns[status]}
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
