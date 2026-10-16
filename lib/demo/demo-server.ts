import type { z } from "zod";

import {
  createCommentSchema,
  createNoteSchema,
  createSubtaskSchema,
  createTaskSchema,
  describeIssue,
  validationErrorMap,
  reorderNotesSchema,
  reorderSubtasksSchema,
  reorderTasksSchema,
  updateNoteSchema,
  updateProfileSchema,
  updateSubtaskSchema,
  updateTaskSchema,
} from "@/lib/api/schemas";
import type { DemoState } from "@/lib/demo/seed";
import { isSamePermutation } from "@/lib/ordering";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import type { Note } from "@/types/note";
import type { Task } from "@/types/task";

export class DemoHttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type Handler = (params: string[], body: unknown) => unknown;

const now = () => new Date().toISOString();
const live = <T extends { deleted_at: string | null }>(items: T[]) => items.filter((item) => !item.deleted_at);

function parse<Schema extends z.ZodType>(schema: Schema, body: unknown, locale: Locale): z.infer<Schema> {
  const result = schema.safeParse(body, { error: validationErrorMap(locale) });
  if (!result.success) throw new DemoHttpError(400, describeIssue(result.error, locale));
  return result.data;
}

/**
 * In-memory implementation of the app's REST routes, used by the public demo
 * and by end-to-end tests. It mirrors the server's validation and the
 * database triggers (status/description history, timestamps).
 */
export function createDemoServer(state: DemoState, getLocale: () => Locale = () => DEFAULT_LOCALE) {
  const findTask = (id: string) => {
    const task = state.tasks.find((item) => item.id === id);
    if (!task) throw new DemoHttpError(404, "Tarefa não encontrada.");
    return task;
  };
  const findNote = (id: string) => {
    const note = state.notes.find((item) => item.id === id);
    if (!note) throw new DemoHttpError(404, "Anotação não encontrada.");
    return note;
  };
  const touch = (task: Task) => {
    task.updated_at = now();
    return { task: structuredClone(task) };
  };
  const touchNote = (note: Note) => {
    note.updated_at = now();
    return { note: structuredClone(note) };
  };
  const setStatus = (task: Task, status: Task["status"]) => {
    if (status === task.status) return;
    task.status_history.push({
      id: crypto.randomUUID(),
      task_id: task.id,
      from_status: task.status,
      to_status: status,
      changed_at: now(),
    });
    task.status = status;
    task.completed_at = status === "completed" ? now() : null;
  };
  const noAttachments = () => {
    throw new DemoHttpError(400, "Anexos ficam desativados na demonstração.");
  };

  const routes: Array<[string, RegExp, Handler]> = [
    ["POST", /^\/api\/tasks$/, (_params, body) => {
      const input = parse(createTaskSchema, body, getLocale());
      const id = crypto.randomUUID();
      const createdAt = now();
      const status = input.status ?? "not_started";
      const firstPosition = Math.min(0, ...live(state.tasks).map((task) => task.position));
      const task: Task = {
        id,
        title: input.title,
        description: input.description?.trim() || null,
        status,
        priority: input.priority ?? "medium",
        type: input.type ?? "feature",
        category: input.category?.trim() || null,
        position: firstPosition - 1,
        deleted_at: null,
        created_at: createdAt,
        completed_at: status === "completed" ? createdAt : null,
        updated_at: createdAt,
        attachments: [],
        subtasks: (input.subtasks ?? [])
          .map((title) => title.trim())
          .filter(Boolean)
          .map((title, position) => ({
            id: crypto.randomUUID(),
            task_id: id,
            title,
            is_completed: false,
            completed_at: null,
            position,
            created_at: createdAt,
            updated_at: createdAt,
          })),
        status_history: [{ id: crypto.randomUUID(), task_id: id, from_status: null, to_status: status, changed_at: createdAt }],
        description_history: [],
        comments: [],
      };
      state.tasks.push(task);
      return { task: structuredClone(task) };
    }],
    ["PATCH", /^\/api\/tasks\/([^/]+)$/, ([id], body) => {
      const task = findTask(id);
      const input = parse(updateTaskSchema, body, getLocale());
      if (input.title !== undefined) task.title = input.title;
      if (input.description !== undefined) {
        const description = input.description?.trim() || null;
        if (description !== task.description) {
          task.description_history.unshift({
            id: crypto.randomUUID(),
            task_id: id,
            description: task.description,
            changed_at: now(),
          });
          task.description = description;
        }
      }
      if (input.status) setStatus(task, input.status);
      if (input.priority) task.priority = input.priority;
      if (input.type) task.type = input.type;
      if (input.category !== undefined) task.category = input.category?.trim() || null;
      return touch(task);
    }],
    ["DELETE", /^\/api\/tasks\/([^/]+)$/, ([id]) => {
      findTask(id).deleted_at = now();
      return { success: true };
    }],
    ["POST", /^\/api\/tasks\/([^/]+)\/restore$/, ([id]) => {
      const task = findTask(id);
      task.deleted_at = null;
      return touch(task);
    }],
    ["POST", /^\/api\/tasks\/reorder$/, (_params, body) => {
      const { task_ids } = parse(reorderTasksSchema, body, getLocale());
      const current = live(state.tasks);
      if (!isSamePermutation(current.map((task) => task.id), task_ids)) {
        throw new DemoHttpError(500, "A ordem das tarefas está desatualizada. Recarregue a página.");
      }
      task_ids.forEach((id, position) => {
        findTask(id).position = position;
      });
      return { success: true };
    }],
    ["POST", /^\/api\/tasks\/([^/]+)\/attachments$/, noAttachments],
    ["DELETE", /^\/api\/tasks\/([^/]+)\/attachments\/([^/]+)$/, ([id, attachmentId]) => {
      const task = findTask(id);
      task.attachments = task.attachments.filter((item) => item.id !== attachmentId);
      return touch(task);
    }],
    ["POST", /^\/api\/tasks\/([^/]+)\/attachments\/([^/]+)$/, () => ({ success: true })],
    ["POST", /^\/api\/tasks\/([^/]+)\/subtasks$/, ([id], body) => {
      const task = findTask(id);
      const { title } = parse(createSubtaskSchema, body, getLocale());
      task.subtasks.push({
        id: crypto.randomUUID(),
        task_id: id,
        title,
        is_completed: false,
        completed_at: null,
        position: task.subtasks.length,
        created_at: now(),
        updated_at: now(),
      });
      return touch(task);
    }],
    ["POST", /^\/api\/tasks\/([^/]+)\/subtasks\/reorder$/, ([id], body) => {
      const task = findTask(id);
      const { subtask_ids } = parse(reorderSubtasksSchema, body, getLocale());
      if (!isSamePermutation(task.subtasks.map((subtask) => subtask.id), subtask_ids)) {
        throw new DemoHttpError(500, "A ordem das subtarefas está desatualizada.");
      }
      const byId = new Map(task.subtasks.map((subtask) => [subtask.id, subtask]));
      task.subtasks = subtask_ids.map((subtaskId, position) => ({ ...byId.get(subtaskId)!, position }));
      return touch(task);
    }],
    ["PATCH", /^\/api\/subtasks\/([^/]+)$/, ([subtaskId], body) => {
      const input = parse(updateSubtaskSchema, body, getLocale());
      const task = state.tasks.find((item) => item.subtasks.some((subtask) => subtask.id === subtaskId));
      const subtask = task?.subtasks.find((item) => item.id === subtaskId);
      if (!task || !subtask) throw new DemoHttpError(404, "Subtarefa não encontrada.");
      if (input.title !== undefined) subtask.title = input.title;
      if (input.is_completed !== undefined) {
        subtask.is_completed = input.is_completed;
        subtask.completed_at = input.is_completed ? now() : null;
      }
      subtask.updated_at = now();
      return touch(task);
    }],
    ["DELETE", /^\/api\/subtasks\/([^/]+)$/, ([subtaskId]) => {
      const task = state.tasks.find((item) => item.subtasks.some((subtask) => subtask.id === subtaskId));
      if (!task) throw new DemoHttpError(404, "Subtarefa não encontrada.");
      task.subtasks = task.subtasks.filter((subtask) => subtask.id !== subtaskId);
      return touch(task);
    }],
    ["POST", /^\/api\/tasks\/([^/]+)\/comments$/, ([id], body) => {
      const task = findTask(id);
      const { content } = parse(createCommentSchema, body, getLocale());
      task.comments.push({ id: crypto.randomUUID(), task_id: id, content, created_at: now() });
      return touch(task);
    }],
    ["DELETE", /^\/api\/tasks\/([^/]+)\/comments\/([^/]+)$/, ([id, commentId]) => {
      const task = findTask(id);
      task.comments = task.comments.filter((comment) => comment.id !== commentId);
      return touch(task);
    }],
    ["POST", /^\/api\/tasks\/([^/]+)\/description-history\/([^/]+)\/restore$/, ([id, historyId]) => {
      const task = findTask(id);
      const revision = task.description_history.find((item) => item.id === historyId);
      if (!revision) throw new DemoHttpError(404, "Versão não encontrada.");
      task.description_history.unshift({ id: crypto.randomUUID(), task_id: id, description: task.description, changed_at: now() });
      task.description = revision.description;
      return touch(task);
    }],
    ["POST", /^\/api\/notes$/, (_params, body) => {
      const input = parse(createNoteSchema, body, getLocale());
      const note: Note = {
        id: crypto.randomUUID(),
        title: input.title,
        content: input.content,
        tags: input.tags ?? null,
        is_pinned: false,
        pinned_position: null,
        deleted_at: null,
        attachments: [],
        created_at: now(),
        updated_at: now(),
      };
      state.notes.unshift(note);
      return { note: structuredClone(note) };
    }],
    ["PATCH", /^\/api\/notes\/([^/]+)$/, ([id], body) => {
      const note = findNote(id);
      const input = parse(updateNoteSchema, body, getLocale());
      Object.assign(
        note,
        Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)),
      );
      return touchNote(note);
    }],
    ["DELETE", /^\/api\/notes\/([^/]+)$/, ([id]) => {
      findNote(id).deleted_at = now();
      return { success: true };
    }],
    ["POST", /^\/api\/notes\/([^/]+)\/restore$/, ([id]) => {
      const note = findNote(id);
      note.deleted_at = null;
      return touchNote(note);
    }],
    ["POST", /^\/api\/notes\/reorder$/, (_params, body) => {
      const { noteIds } = parse(reorderNotesSchema, body, getLocale());
      noteIds.forEach((id, position) => {
        const note = state.notes.find((item) => item.id === id && item.is_pinned);
        if (note) note.pinned_position = position;
      });
      return { success: true };
    }],
    ["POST", /^\/api\/notes\/([^/]+)\/attachments$/, noAttachments],
    ["DELETE", /^\/api\/notes\/([^/]+)\/attachments\/([^/]+)$/, ([id, attachmentId]) => {
      const note = findNote(id);
      note.attachments = note.attachments.filter((item) => item.id !== attachmentId);
      return touchNote(note);
    }],
    ["GET", /^\/api\/trash$/, () => ({
      tasks: structuredClone(state.tasks.filter((task) => task.deleted_at)),
      notes: structuredClone(state.notes.filter((note) => note.deleted_at)),
    })],
    ["PATCH", /^\/api\/profile$/, (_params, body) => {
      const input = parse(updateProfileSchema, body, getLocale());
      Object.assign(
        state.profile,
        Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)),
        { updated_at: now() },
      );
      return { profile: structuredClone(state.profile) };
    }],
    ["POST", /^\/api\/profile\/avatar$/, () => {
      throw new DemoHttpError(400, "Fotos de perfil ficam desativadas na demonstração.");
    }],
  ];

  return {
    handle(method: string, url: string, body?: unknown) {
      const path = new URL(url, "http://demo.local").pathname;
      for (const [routeMethod, pattern, handler] of routes) {
        const match = routeMethod === method ? pattern.exec(path) : null;
        if (match) return handler(match.slice(1).map(decodeURIComponent), body);
      }
      throw new DemoHttpError(404, `Rota não encontrada: ${method} ${path}`);
    },
  };
}
