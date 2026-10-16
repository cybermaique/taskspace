import { DEFAULT_LOCALE, translate, type Locale } from "@/lib/i18n";

export const TASK_STATUSES = [
  "not_started",
  "in_progress",
  "waiting",
  "completed",
] as const;
export const TASK_PRIORITIES = ["low", "medium", "high"] as const;
export const TASK_TYPES = [
  "feature",
  "bug",
  "improvement",
  "study",
  "travel",
  "health",
  "finance",
  "personal",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export type TaskType = (typeof TASK_TYPES)[number];

export function isTaskStatus(value: unknown): value is TaskStatus {
  return TASK_STATUSES.includes(value as TaskStatus);
}

export function isTaskPriority(value: unknown): value is TaskPriority {
  return TASK_PRIORITIES.includes(value as TaskPriority);
}

export function isTaskType(value: unknown): value is TaskType {
  return TASK_TYPES.includes(value as TaskType);
}

/** Rows may hold types retired from the app (e.g. "date"); show them as personal. */
export function normalizeTaskType(value: unknown): TaskType {
  return isTaskType(value) ? value : "personal";
}

export const WORK_TASK_TYPE_OPTIONS = [
  { value: "feature", label: "Feature" },
  { value: "bug", label: "Bug" },
  { value: "improvement", label: "Melhoria" },
] as const satisfies ReadonlyArray<{ value: TaskType; label: string }>;

export const PERSONAL_TASK_TYPE_OPTIONS = [
  { value: "study", label: "Estudos" },
  { value: "travel", label: "Viagem" },
  { value: "health", label: "Saúde" },
  { value: "finance", label: "Financeiro" },
  { value: "personal", label: "Outros" },
] as const satisfies ReadonlyArray<{ value: TaskType; label: string }>;

export const TASK_TYPE_OPTIONS = [
  ...WORK_TASK_TYPE_OPTIONS,
  ...PERSONAL_TASK_TYPE_OPTIONS,
] as const;

export const TASK_CATEGORY_OPTIONS = [
  { value: "trabalho", label: "Trabalho" },
  { value: "pessoal", label: "Pessoal" },
] as const;

export function isPersonalCategory(category: string | null | undefined) {
  return category?.trim().toLocaleLowerCase("pt-BR") === "pessoal";
}

export function getTaskTypeOptions(category: string | null | undefined) {
  return isPersonalCategory(category)
    ? PERSONAL_TASK_TYPE_OPTIONS
    : WORK_TASK_TYPE_OPTIONS;
}

export function getDefaultTaskType(category: string | null | undefined): TaskType {
  return isPersonalCategory(category) ? "personal" : "feature";
}

export function getTaskCategoryLabel(category: string | null | undefined, locale: Locale = DEFAULT_LOCALE) {
  const option = TASK_CATEGORY_OPTIONS.find((option) => option.value === category);
  return option ? translate(locale, option.label) : category;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  completed_at: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  file_name: string;
  mime_type: string;
  storage_path: string;
  file_size: number | null;
  last_viewed_at: string | null;
  created_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  content: string;
  created_at: string;
}

export interface TaskStatusHistory {
  id: string;
  task_id: string;
  from_status: TaskStatus | null;
  to_status: TaskStatus;
  changed_at: string;
}

export interface TaskDescriptionHistory {
  id: string;
  task_id: string;
  description: string | null;
  changed_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  category: string | null;
  position: number;
  deleted_at: string | null;
  created_at: string;
  completed_at: string | null;
  updated_at: string;
  attachments: TaskAttachment[];
  subtasks: Subtask[];
  status_history: TaskStatusHistory[];
  description_history: TaskDescriptionHistory[];
  comments: TaskComment[];
}

export type TaskView = "all" | "work" | "personal" | "study" | "travel";

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  category?: string | null;
  subtasks?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  category?: string | null;
}

export interface UpdateSubtaskInput {
  title?: string;
  is_completed?: boolean;
}
