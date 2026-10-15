import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  isTaskPriority,
  isTaskStatus,
  normalizeTaskType,
  type CreateTaskInput,
  type Subtask,
  type Task,
  type TaskAttachment,
  type TaskComment,
  type TaskDescriptionHistory,
  type TaskStatusHistory,
  type UpdateSubtaskInput,
  type UpdateTaskInput,
} from "@/types/task";

const TASK_COLUMNS = `
  id,title,description,status,priority,type,category,position,
  deleted_at,created_at,completed_at,updated_at,
  task_attachments(id,task_id,file_name,mime_type,storage_path,file_size,last_viewed_at,created_at),
  subtasks(id,task_id,title,is_completed,completed_at,position,created_at,updated_at),
  task_status_history(id,task_id,from_status,to_status,changed_at),
  task_description_history(id,task_id,description,changed_at),
  task_comments(id,task_id,content,created_at)
`;

const SUBTASK_COLUMNS =
  "id,task_id,title,is_completed,completed_at,position,created_at,updated_at";

type RawTask = Task & {
  task_attachments?: TaskAttachment[];
  task_status_history?: TaskStatusHistory[];
  task_description_history?: TaskDescriptionHistory[];
  task_comments?: TaskComment[];
};

function byTimeAsc<Key extends "changed_at" | "created_at">(key: Key) {
  return (left: Record<Key, string>, right: Record<Key, string>) =>
    new Date(left[key]).getTime() - new Date(right[key]).getTime();
}

function mapTask(raw: RawTask): Task {
  const {
    task_attachments,
    task_status_history,
    task_description_history,
    task_comments,
    ...task
  } = raw;

  return {
    ...task,
    type: normalizeTaskType(task.type),
    attachments: task_attachments ?? [],
    subtasks: [...(task.subtasks ?? [])].sort(
      (left, right) =>
        left.position - right.position ||
        new Date(left.created_at).getTime() - new Date(right.created_at).getTime(),
    ),
    status_history: [...(task_status_history ?? [])].sort(byTimeAsc("changed_at")),
    description_history: [...(task_description_history ?? [])]
      .sort(byTimeAsc("changed_at"))
      .reverse(),
    comments: [...(task_comments ?? [])].sort(byTimeAsc("created_at")),
  };
}

function normalizeNullableText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function getAttachmentMimeType(file: File) {
  if (file.type) return file.type;

  const extension = file.name.split(".").pop()?.toLocaleLowerCase();
  const byExtension: Record<string, string> = {
    pdf: "application/pdf",
    txt: "text/plain",
    md: "text/plain",
    log: "text/plain",
    json: "application/json",
    csv: "text/csv",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
  };
  return (extension && byExtension[extension]) || "application/octet-stream";
}

function getSafeExtension(file: File) {
  return file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12) || "bin";
}

export async function listTasks() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_COLUMNS)
    .is("deleted_at", null)
    .order("position", { ascending: true });

  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as RawTask[]).map(mapTask);
}

export async function getTaskById(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_COLUMNS)
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return mapTask(data as unknown as RawTask);
}

export async function createTask(input: CreateTaskInput) {
  const supabase = await createSupabaseServerClient();
  const { data: firstTask, error: firstTaskError } = await supabase
    .from("tasks")
    .select("position")
    .is("deleted_at", null)
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (firstTaskError) throw new Error(firstTaskError.message);

  const status = isTaskStatus(input.status) ? input.status : "not_started";
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: input.title.trim(),
      description: normalizeNullableText(input.description),
      status,
      priority: isTaskPriority(input.priority) ? input.priority : "medium",
      type: input.type ? normalizeTaskType(input.type) : "feature",
      category: normalizeNullableText(input.category),
      position: (firstTask?.position ?? 1) - 1,
      completed_at: status === "completed" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  const taskId = (data as { id: string }).id;

  const subtaskTitles = (input.subtasks ?? [])
    .map((title) => title.trim())
    .filter(Boolean)
    .slice(0, 50);

  if (subtaskTitles.length) {
    const { error: subtasksError } = await supabase.from("subtasks").insert(
      subtaskTitles.map((title, position) => ({
        task_id: taskId,
        title,
        is_completed: false,
        position,
      })),
    );
    if (subtasksError) throw new Error(subtasksError.message);
  }

  return getTaskById(taskId);
}

export async function updateTask(id: string, input: UpdateTaskInput) {
  const supabase = await createSupabaseServerClient();
  const updatePayload: Record<string, string | number | null> = {};

  if (typeof input.title === "string" && input.title.trim()) {
    updatePayload.title = input.title.trim().slice(0, 200);
  }
  if (input.description !== undefined) {
    updatePayload.description = normalizeNullableText(input.description);
  }
  if (isTaskStatus(input.status)) {
    updatePayload.status = input.status;
    updatePayload.completed_at =
      input.status === "completed" ? new Date().toISOString() : null;
  }
  if (isTaskPriority(input.priority)) updatePayload.priority = input.priority;
  if (input.type !== undefined) updatePayload.type = normalizeTaskType(input.type);
  if (input.category !== undefined) {
    updatePayload.category = normalizeNullableText(input.category);
  }

  if (Object.keys(updatePayload).length) {
    const { error } = await supabase.from("tasks").update(updatePayload).eq("id", id);
    if (error) throw new Error(error.message);
  }

  return getTaskById(id);
}

export async function restoreTaskDescription(taskId: string, historyId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: revision, error: revisionError } = await supabase
    .from("task_description_history")
    .select("description")
    .eq("id", historyId)
    .eq("task_id", taskId)
    .single();
  if (revisionError) throw new Error(revisionError.message);

  const { error: updateError } = await supabase
    .from("tasks")
    .update({ description: (revision as { description: string | null }).description })
    .eq("id", taskId);
  if (updateError) throw new Error(updateError.message);

  return getTaskById(taskId);
}

export async function deleteTask(id: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("tasks")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listTrashedTasks() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_COLUMNS)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as RawTask[]).map(mapTask);
}

export async function restoreTask(id: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("tasks").update({ deleted_at: null }).eq("id", id);
  if (error) throw new Error(error.message);
  return getTaskById(id);
}

export async function reorderTasks(orderedTaskIds: string[]) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("tasks").select("id,position").is("deleted_at", null);
  if (error) throw new Error(error.message);

  const current = new Map((data ?? []).map((task) => [task.id as string, task.position as number]));
  const ids = new Set(orderedTaskIds);
  if (ids.size !== current.size || orderedTaskIds.some((id) => !current.has(id))) {
    throw new Error("A ordem das tarefas está desatualizada. Recarregue a página.");
  }

  // Only rows whose position actually changed are written.
  const results = await Promise.all(
    orderedTaskIds
      .map((id, position) => ({ id, position }))
      .filter(({ id, position }) => current.get(id) !== position)
      .map(({ id, position }) => supabase.from("tasks").update({ position }).eq("id", id)),
  );
  const updateError = results.find((result) => result.error)?.error;
  if (updateError) throw new Error(updateError.message);
}

/* ── attachments ───────────────────────────────────────── */

export async function createTaskAttachment(taskId: string, file: File) {
  const supabase = await createSupabaseServerClient();
  const extension = getSafeExtension(file);
  const mimeType = getAttachmentMimeType(file);
  const storagePath = `${taskId}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("task-attachments")
    .upload(storagePath, file, { contentType: mimeType, upsert: false });
  if (uploadError) throw new Error(uploadError.message);

  const { error: insertError } = await supabase.from("task_attachments").insert({
    task_id: taskId,
    file_name: file.name || `arquivo.${extension}`,
    mime_type: mimeType,
    storage_path: storagePath,
    file_size: file.size,
  });

  if (insertError) {
    await supabase.storage.from("task-attachments").remove([storagePath]);
    throw new Error(insertError.message);
  }

  return getTaskById(taskId);
}

export async function getTaskAttachment(taskId: string, attachmentId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: attachment, error } = await supabase
    .from("task_attachments")
    .select("id,task_id,file_name,mime_type,storage_path,file_size,last_viewed_at,created_at")
    .eq("id", attachmentId)
    .eq("task_id", taskId)
    .single();
  if (error) throw new Error(error.message);

  const { data, error: downloadError } = await supabase.storage
    .from("task-attachments")
    .download((attachment as TaskAttachment).storage_path);
  if (downloadError) throw new Error(downloadError.message);

  return { attachment: attachment as TaskAttachment, data };
}

export async function deleteTaskAttachment(taskId: string, attachmentId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: attachment, error: findError } = await supabase
    .from("task_attachments")
    .select("storage_path")
    .eq("id", attachmentId)
    .eq("task_id", taskId)
    .single();
  if (findError) throw new Error(findError.message);

  const { error: deleteError } = await supabase
    .from("task_attachments")
    .delete()
    .eq("id", attachmentId)
    .eq("task_id", taskId);
  if (deleteError) throw new Error(deleteError.message);

  await supabase.storage
    .from("task-attachments")
    .remove([(attachment as { storage_path: string }).storage_path]);

  return getTaskById(taskId);
}

export async function markTaskAttachmentViewed(taskId: string, attachmentId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("task_attachments")
    .update({ last_viewed_at: new Date().toISOString() })
    .eq("id", attachmentId)
    .eq("task_id", taskId);
  if (error) throw new Error(error.message);
}

/* ── subtasks ──────────────────────────────────────────── */

export async function createSubtask(taskId: string, title: string) {
  const supabase = await createSupabaseServerClient();
  const { data: lastSubtask, error: lastSubtaskError } = await supabase
    .from("subtasks")
    .select("position")
    .eq("task_id", taskId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lastSubtaskError) throw new Error(lastSubtaskError.message);

  const { error } = await supabase.from("subtasks").insert({
    task_id: taskId,
    title: title.trim().slice(0, 200),
    is_completed: false,
    position: (lastSubtask?.position ?? -1) + 1,
  });
  if (error) throw new Error(error.message);

  return getTaskById(taskId);
}

export async function updateSubtask(id: string, input: UpdateSubtaskInput) {
  const supabase = await createSupabaseServerClient();
  const updatePayload: Record<string, string | boolean | null> = {};

  if (typeof input.title === "string" && input.title.trim()) {
    updatePayload.title = input.title.trim().slice(0, 200);
  }
  if (typeof input.is_completed === "boolean") {
    updatePayload.is_completed = input.is_completed;
    updatePayload.completed_at = input.is_completed ? new Date().toISOString() : null;
  }

  const { data, error } = Object.keys(updatePayload).length
    ? await supabase
        .from("subtasks")
        .update(updatePayload)
        .eq("id", id)
        .select(SUBTASK_COLUMNS)
        .single()
    : await supabase.from("subtasks").select(SUBTASK_COLUMNS).eq("id", id).single();
  if (error) throw new Error(error.message);

  return getTaskById((data as Subtask).task_id);
}

export async function deleteSubtask(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("subtasks")
    .delete()
    .eq("id", id)
    .select("task_id")
    .single();
  if (error) throw new Error(error.message);

  return getTaskById((data as { task_id: string }).task_id);
}

export async function reorderSubtasks(taskId: string, orderedSubtaskIds: string[]) {
  const supabase = await createSupabaseServerClient();
  const { data: currentSubtasks, error: currentError } = await supabase
    .from("subtasks")
    .select("id")
    .eq("task_id", taskId);
  if (currentError) throw new Error(currentError.message);

  const currentIds = new Set((currentSubtasks ?? []).map((subtask) => subtask.id as string));
  const uniqueIds = new Set(orderedSubtaskIds);
  if (
    uniqueIds.size !== currentIds.size ||
    orderedSubtaskIds.some((id) => !currentIds.has(id))
  ) {
    throw new Error("A ordem das subtarefas está desatualizada.");
  }

  const updates = await Promise.all(
    orderedSubtaskIds.map((id, position) =>
      supabase.from("subtasks").update({ position }).eq("id", id).eq("task_id", taskId),
    ),
  );
  const updateError = updates.find((result) => result.error)?.error;
  if (updateError) throw new Error(updateError.message);

  return getTaskById(taskId);
}

/* ── comments ──────────────────────────────────────────── */

export async function createTaskComment(taskId: string, content: string) {
  const supabase = await createSupabaseServerClient();
  const text = content.trim().slice(0, 4000);
  if (!text) throw new Error("Escreva um comentário.");

  const { error } = await supabase.from("task_comments").insert({ task_id: taskId, content: text });
  if (error) throw new Error(error.message);
  return getTaskById(taskId);
}

export async function deleteTaskComment(taskId: string, commentId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("task_comments")
    .delete()
    .eq("id", commentId)
    .eq("task_id", taskId);
  if (error) throw new Error(error.message);
  return getTaskById(taskId);
}
