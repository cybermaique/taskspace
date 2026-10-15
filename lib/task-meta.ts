import {
  BookOpen,
  Bug,
  CircleCheck,
  CircleDashed,
  CirclePause,
  CircleDot,
  HeartPulse,
  Lightbulb,
  Plane,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Sparkles,
  UserRound,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import {
  TASK_TYPE_OPTIONS,
  type Task,
  type TaskPriority,
  type TaskStatus,
  type TaskType,
} from "@/types/task";

interface Meta {
  label: string;
  icon: LucideIcon;
  /** Tailwind classes for the icon/text color. */
  tone: string;
}

export const STATUS_META: Record<TaskStatus, Meta & { dot: string }> = {
  not_started: { label: "A fazer", icon: CircleDashed, tone: "text-status-todo", dot: "bg-status-todo" },
  in_progress: { label: "Em andamento", icon: CircleDot, tone: "text-status-progress", dot: "bg-status-progress" },
  waiting: { label: "Aguardando", icon: CirclePause, tone: "text-status-waiting", dot: "bg-status-waiting" },
  completed: { label: "Concluída", icon: CircleCheck, tone: "text-status-done", dot: "bg-status-done" },
};

export const PRIORITY_META: Record<TaskPriority, Meta> = {
  low: { label: "Baixa", icon: SignalLow, tone: "text-muted-foreground" },
  medium: { label: "Média", icon: SignalMedium, tone: "text-status-waiting" },
  high: { label: "Alta", icon: SignalHigh, tone: "text-destructive" },
};

const TYPE_ICONS: Record<TaskType, LucideIcon> = {
  feature: Sparkles,
  bug: Bug,
  improvement: Lightbulb,
  study: BookOpen,
  travel: Plane,
  health: HeartPulse,
  finance: WalletCards,
  personal: UserRound,
};

const TYPE_TONES: Record<TaskType, string> = {
  feature: "text-sky-600 dark:text-sky-400",
  bug: "text-rose-600 dark:text-rose-400",
  improvement: "text-violet-600 dark:text-violet-400",
  study: "text-amber-600 dark:text-amber-400",
  travel: "text-cyan-600 dark:text-cyan-400",
  health: "text-emerald-600 dark:text-emerald-400",
  finance: "text-lime-700 dark:text-lime-400",
  personal: "text-slate-600 dark:text-slate-400",
};

export function getTypeMeta(type: TaskType): Meta {
  return {
    label: TASK_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? "Feature",
    icon: TYPE_ICONS[type] ?? Sparkles,
    tone: TYPE_TONES[type] ?? "text-muted-foreground",
  };
}

export const PRIORITY_ORDER: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };

export function getSubtaskProgress(task: Task) {
  const total = task.subtasks.length;
  const done = task.subtasks.filter((subtask) => subtask.is_completed).length;
  return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
}
