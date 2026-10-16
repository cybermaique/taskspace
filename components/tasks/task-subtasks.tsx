"use client";

import { useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, X } from "lucide-react";

import { restrictToVerticalAxis } from "@/components/tasks/dnd-modifiers";
import { Checkbox } from "@/components/ui/checkbox";
import { useWorkspaceActions } from "@/components/workspace/workspace-provider";

import { cn } from "@/lib/utils";
import type { Subtask, Task } from "@/types/task";
import { useI18n } from "@/components/i18n-provider";
import { useSortableAccessibility } from "@/lib/use-sortable-accessibility";
import { useFormat } from "@/lib/use-format";

function SubtaskRow({ taskId, subtask }: { taskId: string; subtask: Subtask }) {
  const { formatDateTime } = useFormat();
  const { t } = useI18n();
  const actions = useWorkspaceActions();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(subtask.title);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: subtask.id });

  const commit = () => {
    const value = title.trim();
    setEditing(false);
    if (value && value !== subtask.title) void actions.renameSubtask(taskId, subtask.id, value);
    else setTitle(subtask.title);
  };

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "group/subtask relative flex min-h-9 items-center gap-2 rounded-lg px-1 transition-colors hover:bg-accent/60",
        isDragging && "z-10 bg-card shadow-lifted",
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="inline-flex size-6 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted-foreground/60 opacity-0 transition-opacity group-hover/subtask:opacity-100 focus-visible:opacity-100 active:cursor-grabbing pointer-coarse:opacity-100"
        aria-label={t("Reordenar {name}", { name: subtask.title })}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3.5" />
      </button>
      <Checkbox
        checked={subtask.is_completed}
        onCheckedChange={(checked) => void actions.toggleSubtask(taskId, subtask.id, checked === true)}
        aria-label={subtask.title}
      />
      {editing ? (
        <input
          autoFocus
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") commit();
            if (event.key === "Escape") {
              setTitle(subtask.title);
              setEditing(false);
            }
          }}
          maxLength={200}
          className="h-7 min-w-0 flex-1 rounded-md border border-input bg-card px-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
        />
      ) : (
        <span
          onDoubleClick={() => setEditing(true)}
          title={
            subtask.is_completed && subtask.completed_at
              ? t("Concluída em {date} · duplo clique para editar", { date: formatDateTime(subtask.completed_at) })
              : t("Duplo clique para editar")
          }
          className={cn(
            "min-w-0 flex-1 cursor-text py-1 text-sm break-words",
            subtask.is_completed && "text-muted-foreground line-through decoration-muted-foreground/40",
          )}
        >
          {subtask.title}
        </span>
      )}
      <button
        type="button"
        onClick={() => void actions.deleteSubtask(taskId, subtask.id)}
        className="inline-flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity group-hover/subtask:opacity-100 hover:text-destructive focus-visible:opacity-100 pointer-coarse:opacity-100"
        aria-label={t("Excluir {name}", { name: subtask.title })}
      >
        <X className="size-3.5" />
      </button>
    </li>
  );
}

export function TaskSubtasks({ task }: { task: Task }) {
  const { t } = useI18n();
  const accessibility = useSortableAccessibility(task.subtasks);
  const actions = useWorkspaceActions();
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const done = task.subtasks.filter((subtask) => subtask.is_completed).length;
  const total = task.subtasks.length;

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const ids = task.subtasks.map((subtask) => subtask.id);
    void actions.reorderSubtasks(
      task.id,
      arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))),
    );
  };

  const submit = async () => {
    const title = draft.trim();
    if (!title || adding) return;
    setAdding(true);
    const created = await actions.addSubtask(task.id, title);
    setAdding(false);
    if (created) setDraft("");
  };

  return (
    <div>
      {total ? (
        <div className="mb-2 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-500",
                done === total ? "bg-status-done" : "bg-primary",
              )}
              style={{ width: `${(done / total) * 100}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {done}/{total}
          </span>
        </div>
      ) : null}

      <DndContext
        id={`subtasks-${task.id}`}
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
        accessibility={accessibility}
      >
        <SortableContext items={task.subtasks.map((subtask) => subtask.id)} strategy={verticalListSortingStrategy}>
          <ul className="-mx-1 space-y-0.5">
            {task.subtasks.map((subtask) => (
              <SubtaskRow key={subtask.id} taskId={task.id} subtask={subtask} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className="mt-1 flex items-center gap-2 rounded-lg px-1"
      >
        <Plus className="ml-1.5 size-4 shrink-0 text-muted-foreground" />
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={adding}
          maxLength={200}
          placeholder={t("Adicionar subtarefa e pressionar Enter")}
          aria-label={t("Nova subtarefa")}
          className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-60"
        />
      </form>
    </div>
  );
}
