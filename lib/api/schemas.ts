import { z } from "zod";

import { PROFILE_ACCENTS } from "@/types/profile";
import { TASK_PRIORITIES, TASK_STATUSES, TASK_TYPES } from "@/types/task";

z.config(z.locales.pt());

const id = z.uuid();
const required = (label: string, max: number) =>
  z.string({ error: `Informe ${label}.` }).trim().min(1, `Informe ${label}.`).max(max);

/* ── tasks ─────────────────────────────────────────────── */

export const createTaskSchema = z.object({
  title: required("um título para a tarefa", 200),
  description: z.string().max(20_000).optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  type: z.enum(TASK_TYPES).optional(),
  category: z.string().max(60).nullable().optional(),
  subtasks: z.array(z.string().max(200)).max(50).optional(),
});

export const updateTaskSchema = z.object({
  title: required("um título para a tarefa", 200).optional(),
  description: z.string().max(20_000).nullable().optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  type: z.enum(TASK_TYPES).optional(),
  category: z.string().max(60).nullable().optional(),
});

export const reorderTasksSchema = z.object({ task_ids: z.array(id).min(1) });

export const createSubtaskSchema = z.object({ title: required("o título da subtarefa", 200) });

export const updateSubtaskSchema = z.object({
  title: required("o título da subtarefa", 200).optional(),
  is_completed: z.boolean().optional(),
});

export const reorderSubtasksSchema = z.object({ subtask_ids: z.array(id) });

export const createCommentSchema = z.object({ content: required("um comentário", 4_000) });

/* ── notes ─────────────────────────────────────────────── */

export const createNoteSchema = z.object({
  title: required("o título da anotação", 160),
  content: required("o conteúdo da anotação", 100_000),
  tags: z.array(z.string().max(60)).max(50).nullable().optional(),
});

export const updateNoteSchema = z.object({
  title: required("o título da anotação", 160).optional(),
  content: required("o conteúdo da anotação", 100_000).optional(),
  tags: z.array(z.string().max(60)).max(50).nullable().optional(),
  is_pinned: z.boolean().optional(),
  pinned_position: z.number().int().min(0).nullable().optional(),
});

export const reorderNotesSchema = z.object({ noteIds: z.array(id) });

/* ── profile ───────────────────────────────────────────── */

export const updateProfileSchema = z.object({
  nickname: required("como quer ser chamado", 40).optional(),
  accent_color: z.enum(PROFILE_ACCENTS).optional(),
  display_mode: z.enum(["full", "compact"]).optional(),
  /** Only `null` is accepted here: new avatars go through the upload route. */
  avatar_url: z.null().optional(),
});

export type CreateTaskBody = z.infer<typeof createTaskSchema>;
export type UpdateTaskBody = z.infer<typeof updateTaskSchema>;
export type UpdateProfileBody = z.infer<typeof updateProfileSchema>;

/** First validation message, prefixed with the field when it is not obvious. */
export function describeIssue(error: z.ZodError) {
  const issue = error.issues[0];
  if (!issue) return "Dados inválidos.";
  const field = issue.path.join(".");
  return issue.message.startsWith("Informe") || !field ? issue.message : `${field}: ${issue.message}`;
}
