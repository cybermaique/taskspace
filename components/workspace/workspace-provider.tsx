"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";

import { errorMessage } from "@/lib/api-client";
import { celebrate } from "@/lib/celebrate";
import { planTaskMove } from "@/lib/ordering";
import { applyDocumentAccent } from "@/lib/profile";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { httpTransport, type Transport } from "@/lib/transport";
import type { Note } from "@/types/note";
import type { Profile } from "@/types/profile";
import type {
  CreateTaskInput,
  Task,
  TaskStatus,
  UpdateTaskInput,
} from "@/types/task";

export type WorkspaceView = "tasks" | "notes";

type NoteEditorState = { mode: "create" } | { mode: "view" | "edit"; noteId: string } | null;

/* ── helpers ───────────────────────────────────────────── */

function sortByPosition(tasks: Task[]) {
  return [...tasks].sort(
    (left, right) =>
      left.position - right.position ||
      new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
  );
}

function upsert<T extends { id: string }>(items: T[], item: T, prepend = true) {
  return items.some((current) => current.id === item.id)
    ? items.map((current) => (current.id === item.id ? item : current))
    : prepend
      ? [item, ...items]
      : [...items, item];
}

/** Applies the simple scalar fields of a patch locally for optimistic UI. */
function applyTaskPatch(task: Task, patch: UpdateTaskInput): Task {
  const next: Task = { ...task };
  if (patch.title !== undefined) next.title = patch.title;
  if (patch.description !== undefined) next.description = patch.description;
  if (patch.priority !== undefined) next.priority = patch.priority;
  if (patch.type !== undefined) next.type = patch.type;
  if (patch.category !== undefined) next.category = patch.category;
  if (patch.status !== undefined && patch.status !== task.status) {
    next.status = patch.status;
    next.completed_at = patch.status === "completed" ? new Date().toISOString() : null;
  }
  return next;
}

/* ── context ───────────────────────────────────────────── */

interface WorkspaceData {
  mode: Transport["mode"];
  tasks: Task[];
  notes: Note[];
  profile: Profile;
  email: string | null;
}

interface WorkspaceUI {
  view: WorkspaceView;
  setView: (view: WorkspaceView) => void;
  activeTaskId: string | null;
  openTask: (id: string | null) => void;
  createTaskStatus: TaskStatus | null;
  openCreateTask: (status?: TaskStatus) => void;
  closeCreateTask: () => void;
  noteEditor: NoteEditorState;
  setNoteEditor: (state: NoteEditorState) => void;
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
  trashOpen: boolean;
  setTrashOpen: (open: boolean) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  shortcutsOpen: boolean;
  setShortcutsOpen: (open: boolean) => void;
}

interface WorkspaceActions {
  createTask: (input: CreateTaskInput, files?: File[]) => Promise<Task>;
  updateTask: (id: string, patch: UpdateTaskInput) => Promise<boolean>;
  moveTask: (id: string, status: TaskStatus, beforeId: string | null) => void;
  deleteTask: (id: string) => Promise<void>;
  restoreTask: (id: string) => Promise<void>;
  addAttachments: (taskId: string, files: File[]) => Promise<void>;
  deleteAttachment: (taskId: string, attachmentId: string) => Promise<void>;
  markAttachmentViewed: (taskId: string, attachmentId: string) => void;
  addSubtask: (taskId: string, title: string) => Promise<boolean>;
  toggleSubtask: (taskId: string, subtaskId: string, done: boolean) => Promise<void>;
  renameSubtask: (taskId: string, subtaskId: string, title: string) => Promise<void>;
  deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  reorderSubtasks: (taskId: string, ids: string[]) => Promise<void>;
  addComment: (taskId: string, content: string) => Promise<boolean>;
  deleteComment: (taskId: string, commentId: string) => Promise<void>;
  restoreDescription: (taskId: string, historyId: string) => Promise<void>;

  createNote: (input: { title: string; content: string }, files?: File[]) => Promise<Note>;
  updateNote: (
    id: string,
    input: { title: string; content: string },
    files?: File[],
    removedAttachmentIds?: string[],
  ) => Promise<Note>;
  deleteNote: (id: string) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  reorderPinned: (ids: string[]) => Promise<void>;

  saveProfile: (
    input: Pick<Profile, "nickname" | "accent_color" | "display_mode"> & { removeAvatar?: boolean },
    avatar?: File | null,
  ) => Promise<Profile>;
  loadTrash: () => Promise<{ tasks: Task[]; notes: Note[] }>;
  signOut: () => Promise<void>;
}

const DataContext = createContext<WorkspaceData | null>(null);
const UIContext = createContext<WorkspaceUI | null>(null);
const ActionsContext = createContext<WorkspaceActions | null>(null);

function useRequired<T>(context: React.Context<T | null>, name: string) {
  const value = useContext(context);
  if (!value) throw new Error(`${name} must be used within WorkspaceProvider`);
  return value;
}

export const useWorkspace = () => useRequired(DataContext, "useWorkspace");
export const useWorkspaceUI = () => useRequired(UIContext, "useWorkspaceUI");
export const useWorkspaceActions = () => useRequired(ActionsContext, "useWorkspaceActions");

/* ── provider ──────────────────────────────────────────── */

function syncUrl(params: Record<string, string | null>) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  window.history.replaceState(window.history.state, "", url);
}

export function WorkspaceProvider({
  initialTasks,
  initialNotes,
  initialProfile,
  initialView,
  initialTaskId,
  email,
  transport = httpTransport,
  children,
}: {
  initialTasks: Task[];
  initialNotes: Note[];
  initialProfile: Profile;
  initialView: WorkspaceView;
  initialTaskId: string | null;
  email: string | null;
  transport?: Transport;
  children: ReactNode;
}) {
  const toast = useToast();
  const router = useRouter();
  const [tasks, setTasks] = useState(() => sortByPosition(initialTasks));
  const [notes, setNotes] = useState(initialNotes);
  const [profile, setProfileState] = useState(initialProfile);

  const [view, setViewState] = useState<WorkspaceView>(initialView);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(
    initialTaskId && initialTasks.some((task) => task.id === initialTaskId) ? initialTaskId : null,
  );
  const [createTaskStatus, setCreateTaskStatus] = useState<TaskStatus | null>(null);
  const [noteEditor, setNoteEditor] = useState<NoteEditorState>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const tasksRef = useRef(tasks);
  const notesRef = useRef(notes);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  // Serializes order writes so rapid drags reach the server in sequence.
  const orderQueueRef = useRef<Promise<unknown>>(Promise.resolve());
  const enqueue = useCallback((job: () => Promise<unknown>) => {
    orderQueueRef.current = orderQueueRef.current.then(job, job);
    return orderQueueRef.current;
  }, []);

  useEffect(() => {
    applyDocumentAccent(profile.accent_color);
  }, [profile.accent_color]);

  const setView = useCallback((next: WorkspaceView) => {
    setViewState(next);
    syncUrl({ view: next === "tasks" ? null : next });
  }, []);

  const openTask = useCallback((id: string | null) => {
    setActiveTaskId(id);
    syncUrl({ task: id });
  }, []);

  const replaceTask = useCallback((task: Task) => {
    setTasks((current) => sortByPosition(upsert(current, task)));
  }, []);

  const replaceNote = useCallback((note: Note) => {
    setNotes((current) => upsert(current, note));
  }, []);

  const actions = useMemo<WorkspaceActions>(() => {
    const fail = (error: unknown, fallback: string) => {
      toast.error(errorMessage(error, fallback));
    };

    const taskRequest = (url: string, init?: Parameters<Transport["request"]>[1]) =>
      transport.request<{ task: Task }>(url, init).then(({ task }) => {
        replaceTask(task);
        return task;
      });

    const restoreTask = async (id: string) => {
      try {
        await taskRequest(`/api/tasks/${id}/restore`, { method: "POST" });
        toast.success("Tarefa restaurada");
      } catch (error) {
        fail(error, "Não foi possível restaurar a tarefa.");
      }
    };

    const restoreNote = async (id: string) => {
      try {
        const { note } = await transport.request<{ note: Note }>(`/api/notes/${id}/restore`, {
          method: "POST",
        });
        replaceNote(note);
        toast.success("Anotação restaurada");
      } catch (error) {
        fail(error, "Não foi possível restaurar a anotação.");
      }
    };

    return {
      async createTask(input, files = []) {
        let { task } = await transport.request<{ task: Task }>("/api/tasks", {
          method: "POST",
          json: input,
        });
        replaceTask(task);
        for (const file of files) {
          try {
            ({ task } = await transport.upload<{ task: Task }>(`/api/tasks/${task.id}/attachments`, file));
            replaceTask(task);
          } catch (error) {
            fail(error, `Não foi possível anexar ${file.name}.`);
          }
        }
        return task;
      },

      async updateTask(id, patch) {
        const previous = tasksRef.current.find((task) => task.id === id);
        if (!previous) return false;
        setTasks((current) =>
          current.map((task) => (task.id === id ? applyTaskPatch(task, patch) : task)),
        );
        try {
          const task = await taskRequest(`/api/tasks/${id}`, { method: "PATCH", json: patch });
          if (patch.status === "completed" && previous.status !== "completed") celebrate();
          return Boolean(task);
        } catch (error) {
          replaceTask(previous);
          fail(error, "Não foi possível atualizar a tarefa.");
          return false;
        }
      },

      moveTask(id, status, beforeId) {
        const ordered = tasksRef.current;
        const plan = planTaskMove(ordered, id, status, beforeId);
        if (!plan) return;
        const { tasks: rest, statusChanged, orderChanged } = plan;

        const snapshot = ordered;
        setTasks(rest);
        if (statusChanged && status === "completed") celebrate();

        void enqueue(async () => {
          try {
            if (statusChanged) {
              const { task } = await transport.request<{ task: Task }>(`/api/tasks/${id}`, {
                method: "PATCH",
                json: { status },
              });
              setTasks((current) =>
                current.map((item) => (item.id === id ? { ...task, position: item.position } : item)),
              );
            }
            if (orderChanged) {
              await transport.request("/api/tasks/reorder", {
                method: "POST",
                json: { task_ids: rest.map((task) => task.id) },
              });
            }
          } catch (error) {
            setTasks(snapshot);
            fail(error, "Não foi possível mover a tarefa.");
          }
        });
      },

      async deleteTask(id) {
        const snapshot = tasksRef.current;
        const task = snapshot.find((item) => item.id === id);
        setTasks((current) => current.filter((item) => item.id !== id));
        setActiveTaskId((current) => (current === id ? null : current));
        try {
          await transport.request(`/api/tasks/${id}`, { method: "DELETE" });
          toast.success(`"${task?.title ?? "Tarefa"}" foi para a lixeira`, {
            action: { label: "Desfazer", onClick: () => void restoreTask(id) },
          });
        } catch (error) {
          setTasks(snapshot);
          fail(error, "Não foi possível excluir a tarefa.");
        }
      },

      restoreTask,

      async addAttachments(taskId, files) {
        for (const file of files) {
          try {
            const { task } = await transport.upload<{ task: Task }>(`/api/tasks/${taskId}/attachments`, file);
            replaceTask(task);
          } catch (error) {
            fail(error, `Não foi possível anexar ${file.name}.`);
          }
        }
      },

      async deleteAttachment(taskId, attachmentId) {
        try {
          await taskRequest(`/api/tasks/${taskId}/attachments/${attachmentId}`, { method: "DELETE" });
          toast.success("Anexo removido");
        } catch (error) {
          fail(error, "Não foi possível remover o anexo.");
        }
      },

      markAttachmentViewed(taskId, attachmentId) {
        void transport
          .request(`/api/tasks/${taskId}/attachments/${attachmentId}`, { method: "POST" })
          .catch(() => undefined);
      },

      async addSubtask(taskId, title) {
        try {
          await taskRequest(`/api/tasks/${taskId}/subtasks`, { method: "POST", json: { title } });
          return true;
        } catch (error) {
          fail(error, "Não foi possível criar a subtarefa.");
          return false;
        }
      },

      async toggleSubtask(taskId, subtaskId, done) {
        const previous = tasksRef.current.find((task) => task.id === taskId);
        if (!previous) return;
        const optimistic = {
          ...previous,
          subtasks: previous.subtasks.map((subtask) =>
            subtask.id === subtaskId ? { ...subtask, is_completed: done } : subtask,
          ),
        };
        replaceTask(optimistic);
        if (done && optimistic.subtasks.every((subtask) => subtask.is_completed)) {
          celebrate();
          toast.success("Todas as subtarefas concluídas!");
        }
        try {
          await taskRequest(`/api/subtasks/${subtaskId}`, {
            method: "PATCH",
            json: { is_completed: done },
          });
        } catch (error) {
          replaceTask(previous);
          fail(error, "Não foi possível atualizar a subtarefa.");
        }
      },

      async renameSubtask(_taskId, subtaskId, title) {
        try {
          await taskRequest(`/api/subtasks/${subtaskId}`, { method: "PATCH", json: { title } });
        } catch (error) {
          fail(error, "Não foi possível renomear a subtarefa.");
        }
      },

      async deleteSubtask(taskId, subtaskId) {
        const previous = tasksRef.current.find((task) => task.id === taskId);
        if (!previous) return;
        replaceTask({
          ...previous,
          subtasks: previous.subtasks.filter((subtask) => subtask.id !== subtaskId),
        });
        try {
          await taskRequest(`/api/subtasks/${subtaskId}`, { method: "DELETE" });
        } catch (error) {
          replaceTask(previous);
          fail(error, "Não foi possível excluir a subtarefa.");
        }
      },

      async reorderSubtasks(taskId, ids) {
        const previous = tasksRef.current.find((task) => task.id === taskId);
        if (!previous) return;
        const byId = new Map(previous.subtasks.map((subtask) => [subtask.id, subtask]));
        replaceTask({
          ...previous,
          subtasks: ids
            .map((id, position) => {
              const subtask = byId.get(id);
              return subtask ? { ...subtask, position } : null;
            })
            .filter((subtask) => subtask !== null),
        });
        try {
          await taskRequest(`/api/tasks/${taskId}/subtasks/reorder`, {
            method: "POST",
            json: { subtask_ids: ids },
          });
        } catch (error) {
          replaceTask(previous);
          fail(error, "Não foi possível reordenar as subtarefas.");
        }
      },

      async addComment(taskId, content) {
        try {
          await taskRequest(`/api/tasks/${taskId}/comments`, { method: "POST", json: { content } });
          return true;
        } catch (error) {
          fail(error, "Não foi possível adicionar o comentário.");
          return false;
        }
      },

      async deleteComment(taskId, commentId) {
        try {
          await taskRequest(`/api/tasks/${taskId}/comments/${commentId}`, { method: "DELETE" });
        } catch (error) {
          fail(error, "Não foi possível excluir o comentário.");
        }
      },

      async restoreDescription(taskId, historyId) {
        try {
          await taskRequest(`/api/tasks/${taskId}/description-history/${historyId}/restore`, {
            method: "POST",
          });
          toast.success("Descrição restaurada");
        } catch (error) {
          fail(error, "Não foi possível restaurar a descrição.");
        }
      },

      async createNote(input, files = []) {
        let { note } = await transport.request<{ note: Note }>("/api/notes", { method: "POST", json: input });
        replaceNote(note);
        for (const file of files) {
          try {
            ({ note } = await transport.upload<{ note: Note }>(`/api/notes/${note.id}/attachments`, file));
            replaceNote(note);
          } catch (error) {
            fail(error, `Não foi possível anexar ${file.name}.`);
          }
        }
        return note;
      },

      async updateNote(id, input, files = [], removedAttachmentIds = []) {
        let { note } = await transport.request<{ note: Note }>(`/api/notes/${id}`, {
          method: "PATCH",
          json: input,
        });
        for (const attachmentId of removedAttachmentIds) {
          ({ note } = await transport.request<{ note: Note }>(`/api/notes/${id}/attachments/${attachmentId}`, {
            method: "DELETE",
          }));
        }
        for (const file of files) {
          ({ note } = await transport.upload<{ note: Note }>(`/api/notes/${id}/attachments`, file));
        }
        replaceNote(note);
        return note;
      },

      async deleteNote(id) {
        const snapshot = notesRef.current;
        const note = snapshot.find((item) => item.id === id);
        setNotes((current) => current.filter((item) => item.id !== id));
        try {
          await transport.request(`/api/notes/${id}`, { method: "DELETE" });
          toast.success(`"${note?.title ?? "Anotação"}" foi para a lixeira`, {
            action: { label: "Desfazer", onClick: () => void restoreNote(id) },
          });
        } catch (error) {
          setNotes(snapshot);
          fail(error, "Não foi possível excluir a anotação.");
        }
      },

      restoreNote,

      async togglePin(id) {
        const previous = notesRef.current.find((note) => note.id === id);
        if (!previous) return;
        const isPinned = !previous.is_pinned;
        const nextPosition = isPinned
          ? Math.max(-1, ...notesRef.current.map((note) => (note.is_pinned ? (note.pinned_position ?? -1) : -1))) + 1
          : null;
        replaceNote({ ...previous, is_pinned: isPinned, pinned_position: nextPosition });
        try {
          const { note } = await transport.request<{ note: Note }>(`/api/notes/${id}`, {
            method: "PATCH",
            json: { is_pinned: isPinned, pinned_position: nextPosition },
          });
          replaceNote(note);
        } catch (error) {
          replaceNote(previous);
          fail(error, "Não foi possível fixar a anotação.");
        }
      },

      async reorderPinned(ids) {
        const snapshot = notesRef.current;
        setNotes((current) =>
          current.map((note) => {
            const position = ids.indexOf(note.id);
            return position === -1 ? note : { ...note, pinned_position: position };
          }),
        );
        try {
          await transport.request("/api/notes/reorder", { method: "POST", json: { noteIds: ids } });
        } catch (error) {
          setNotes(snapshot);
          fail(error, "Não foi possível reordenar as fixadas.");
        }
      },

      async saveProfile({ removeAvatar, ...fields }, avatar) {
        if (avatar) await transport.upload<{ profile: Profile }>("/api/profile/avatar", avatar);
        const { profile } = await transport.request<{ profile: Profile }>("/api/profile", {
          method: "PATCH",
          json: removeAvatar && !avatar ? { ...fields, avatar_url: null } : fields,
        });
        setProfileState(profile);
        return profile;
      },

      async loadTrash() {
        return transport.request<{ tasks: Task[]; notes: Note[] }>("/api/trash");
      },

      async signOut() {
        if (transport.mode === "live") await createSupabaseBrowserClient().auth.signOut();
        router.replace("/login");
        router.refresh();
      },
    };
  }, [enqueue, replaceNote, replaceTask, router, toast, transport]);

  const data = useMemo<WorkspaceData>(
    () => ({
      mode: transport.mode,
      tasks,
      notes,
      profile,
      email,
    }),
    [email, notes, profile, tasks, transport.mode],
  );

  const ui = useMemo<WorkspaceUI>(
    () => ({
      view,
      setView,
      activeTaskId,
      openTask,
      createTaskStatus,
      openCreateTask: (status = "not_started") => setCreateTaskStatus(status),
      closeCreateTask: () => setCreateTaskStatus(null),
      noteEditor,
      setNoteEditor,
      paletteOpen,
      setPaletteOpen,
      trashOpen,
      setTrashOpen,
      settingsOpen,
      setSettingsOpen,
      shortcutsOpen,
      setShortcutsOpen,
    }),
    [
      activeTaskId,
      createTaskStatus,
      noteEditor,
      openTask,
      paletteOpen,
      setView,
      settingsOpen,
      shortcutsOpen,
      trashOpen,
      view,
    ],
  );

  return (
    <DataContext.Provider value={data}>
      <ActionsContext.Provider value={actions}>
        <UIContext.Provider value={ui}>{children}</UIContext.Provider>
      </ActionsContext.Provider>
    </DataContext.Provider>
  );
}
