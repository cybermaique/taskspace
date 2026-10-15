"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";

import { QuickAdd } from "@/components/tasks/quick-add";
import { TaskMeta } from "@/components/tasks/task-card";
import { TaskMenuContent } from "@/components/tasks/task-menu";
import {
  ContextMenu,
  ContextMenuTrigger,
  Menu,
  MenuContent,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from "@/components/ui/menu";
import { useWorkspaceActions, useWorkspaceUI } from "@/components/workspace/workspace-provider";
import { formatShortDate } from "@/lib/format";
import { STATUS_META } from "@/lib/task-meta";
import { cn } from "@/lib/utils";
import { TASK_STATUSES, type CreateTaskInput, type Task, type TaskStatus } from "@/types/task";

function StatusPicker({ task }: { task: Task }) {
  const actions = useWorkspaceActions();
  const meta = STATUS_META[task.status];

  return (
    <Menu>
      <MenuTrigger
        onClick={(event) => event.stopPropagation()}
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-md outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring"
        aria-label={`Status: ${meta.label}. Alterar status`}
      >
        <meta.icon className={cn("size-4", meta.tone)} />
      </MenuTrigger>
      <MenuContent className="w-48">
        <MenuRadioGroup
          value={task.status}
          onValueChange={(value) => actions.moveTask(task.id, value as TaskStatus, null)}
        >
          {TASK_STATUSES.map((status) => {
            const item = STATUS_META[status];
            return (
              <MenuRadioItem key={status} value={status}>
                <item.icon className={item.tone} />
                {item.label}
              </MenuRadioItem>
            );
          })}
        </MenuRadioGroup>
      </MenuContent>
    </Menu>
  );
}

function TaskRow({ task }: { task: Task }) {
  const { openTask } = useWorkspaceUI();
  const isDone = task.status === "completed";

  const row = (
    <div
      role="button"
      tabIndex={0}
      onClick={() => openTask(task.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" && event.target === event.currentTarget) openTask(task.id);
      }}
      className="group/row flex min-h-12 cursor-pointer items-center gap-2 border-b px-2 py-2 outline-none last:border-b-0 hover:bg-accent/60 focus-visible:bg-accent sm:gap-3 sm:px-3"
    >
      <StatusPicker task={task} />
      <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-4">
        <p
          className={cn(
            "truncate text-sm font-medium sm:min-w-0 sm:flex-1",
            isDone && "text-muted-foreground line-through decoration-muted-foreground/40",
          )}
        >
          {task.title}
        </p>
        <div className="mt-0.5 sm:mt-0 sm:shrink-0">
          <TaskMeta task={task} compact />
        </div>
      </div>
      <time
        dateTime={task.created_at}
        className="hidden w-14 shrink-0 text-right text-xs text-muted-foreground tabular-nums sm:block"
        suppressHydrationWarning
      >
        {formatShortDate(task.created_at)}
      </time>
    </div>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger render={row} />
      <TaskMenuContent task={task} />
    </ContextMenu>
  );
}

function ListGroup({
  status,
  tasks,
  defaults,
}: {
  status: TaskStatus;
  tasks: Task[];
  defaults: Partial<CreateTaskInput>;
}) {
  const [open, setOpen] = useState(status !== "completed");
  const meta = STATUS_META[status];

  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-soft">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex h-10 w-full items-center gap-2 bg-subtle px-3 text-left text-sm font-medium transition-colors hover:bg-accent"
      >
        <ChevronRight
          className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-90")}
        />
        <meta.icon className={cn("size-4", meta.tone)} />
        {meta.label}
        <span className="text-xs font-normal text-muted-foreground tabular-nums">{tasks.length}</span>
      </button>
      {open ? (
        <div className="border-t">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
          {status !== "completed" ? (
            <div className="p-1.5">
              <QuickAdd status={status} defaults={defaults} />
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export function TaskListView({
  tasks,
  defaults,
}: {
  tasks: Task[];
  defaults: Partial<CreateTaskInput>;
}) {
  return (
    <div className="space-y-3 pb-4">
      {TASK_STATUSES.map((status) => (
        <ListGroup
          key={status}
          status={status}
          tasks={tasks.filter((task) => task.status === status)}
          defaults={defaults}
        />
      ))}
    </div>
  );
}
