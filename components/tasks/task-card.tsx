"use client";

import { forwardRef, memo, type HTMLAttributes } from "react";
import { Ellipsis, MessageSquare, Paperclip } from "lucide-react";

import { previewText } from "@/components/rich-text";
import { TaskMenuContent } from "@/components/tasks/task-menu";
import { ContextMenu, ContextMenuTrigger, Menu, MenuTrigger } from "@/components/ui/menu";
import { formatShortDate } from "@/lib/format";
import { getSubtaskProgress, getTypeMeta, PRIORITY_META } from "@/lib/task-meta";
import { cn } from "@/lib/utils";
import { getTaskCategoryLabel, type Task } from "@/types/task";

function ProgressRing({ percent }: { percent: number }) {
  const radius = 5;
  const circumference = 2 * Math.PI * radius;
  return (
    <svg viewBox="0 0 14 14" className="size-3.5 -rotate-90" aria-hidden="true">
      <circle cx="7" cy="7" r={radius} fill="none" strokeWidth="2" className="stroke-border" />
      <circle
        cx="7"
        cy="7"
        r={radius}
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - percent / 100)}
        className={cn("transition-[stroke-dashoffset] duration-500", percent === 100 ? "stroke-status-done" : "stroke-primary")}
      />
    </svg>
  );
}

export function TaskMeta({ task, compact = false }: { task: Task; compact?: boolean }) {
  const type = getTypeMeta(task.type);
  const priority = PRIORITY_META[task.priority];
  const progress = getSubtaskProgress(task);

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1" title={`Prioridade ${priority.label.toLowerCase()}`}>
        <priority.icon className={cn("size-3.5", priority.tone)} />
        {!compact ? priority.label : null}
      </span>
      <span className="inline-flex items-center gap-1">
        <type.icon className={cn("size-3.5", type.tone)} />
        {type.label}
      </span>
      {task.category && !compact ? (
        <span className="truncate rounded-md bg-muted px-1.5 py-px text-[0.7rem] font-medium">
          {getTaskCategoryLabel(task.category)}
        </span>
      ) : null}
      {progress.total ? (
        <span className="inline-flex items-center gap-1 tabular-nums" title="Subtarefas concluídas">
          <ProgressRing percent={progress.percent} />
          {progress.done}/{progress.total}
        </span>
      ) : null}
      {task.attachments.length ? (
        <span className="inline-flex items-center gap-0.5 tabular-nums" title="Anexos">
          <Paperclip className="size-3.5" />
          {task.attachments.length}
        </span>
      ) : null}
      {task.comments.length ? (
        <span className="inline-flex items-center gap-0.5 tabular-nums" title="Comentários">
          <MessageSquare className="size-3.5" />
          {task.comments.length}
        </span>
      ) : null}
    </div>
  );
}

interface TaskCardProps extends HTMLAttributes<HTMLDivElement> {
  task: Task;
  compact?: boolean;
  dragging?: boolean;
  overlay?: boolean;
  onOpen?: () => void;
  /** Props for the "open" button, which is also the drag handle for keyboard users. */
  openButtonProps?: HTMLAttributes<HTMLButtonElement>;
  openButtonRef?: (element: HTMLElement | null) => void;
}

/**
 * The card itself is not interactive. A transparent "open" button covers it and
 * the actions menu sits beside it as a sibling, so no control is nested in another.
 */
export const TaskCard = memo(
  forwardRef<HTMLDivElement, TaskCardProps>(function TaskCard(
    {
      task,
      compact = false,
      dragging = false,
      overlay = false,
      onOpen,
      openButtonProps,
      openButtonRef,
      className,
      ...props
    },
    ref,
  ) {
    const isDone = task.status === "completed";
    const description = !compact && task.description ? previewText(task.description, 140) : null;

    const card = (
      <div
        ref={ref}
        data-task-id={task.id}
        data-dragging={dragging}
        className={cn(
          "task-card group/card relative touch-manipulation rounded-xl border bg-card text-left shadow-soft transition-[box-shadow,border-color,opacity] select-none hover:border-foreground/15 hover:shadow-lifted",
          compact ? "p-2.5" : "p-3",
          overlay && "task-card-overlay shadow-overlay",
          className,
        )}
        {...props}
      >
        {!overlay ? (
          <button
            ref={openButtonRef}
            type="button"
            aria-label={task.title}
            {...openButtonProps}
            onClick={onOpen}
            className="absolute inset-0 cursor-pointer rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring"
          />
        ) : null}
        <div className="pointer-events-none relative">
          <div className="flex items-start gap-2">
            <p
              className={cn(
                "min-w-0 flex-1 text-sm leading-snug font-medium break-words",
                compact ? "line-clamp-1" : "line-clamp-3",
                isDone && "text-muted-foreground line-through decoration-muted-foreground/40",
              )}
            >
              {task.title}
            </p>
            {/* Reserves room for the actions button rendered outside this layer. */}
            {!overlay ? <span className="-mt-1 -mr-1.5 size-7 shrink-0" aria-hidden="true" /> : null}
          </div>
          {description ? (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
          <div className={cn("flex items-end justify-between gap-2", compact ? "mt-1.5" : "mt-2.5")}>
            <TaskMeta task={task} compact={compact} />
            {!compact ? (
              <time
                dateTime={task.created_at}
                className="shrink-0 text-[0.7rem] text-muted-foreground tabular-nums"
                suppressHydrationWarning
              >
                {formatShortDate(task.created_at)}
              </time>
            ) : null}
          </div>
        </div>
        {!overlay ? (
          <Menu>
            <MenuTrigger
              onPointerDown={(event) => event.stopPropagation()}
              className={cn(
                "absolute right-1.5 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity outline-none group-hover/card:opacity-100 hover:bg-accent hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring data-popup-open:opacity-100 pointer-coarse:opacity-100",
                compact ? "top-1.5" : "top-2",
              )}
              aria-label={`Ações de ${task.title}`}
            >
              <Ellipsis className="size-4" />
            </MenuTrigger>
            <TaskMenuContent task={task} />
          </Menu>
        ) : null}
      </div>
    );

    if (overlay) return card;

    return (
      <ContextMenu>
        <ContextMenuTrigger render={card} />
        <TaskMenuContent task={task} />
      </ContextMenu>
    );
  }),
);
