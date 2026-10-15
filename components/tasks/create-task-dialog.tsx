"use client";

import { useEffect, useState } from "react";
import { FolderClosed, LoaderCircle, Paperclip, Plus, X } from "lucide-react";

import { FileDropZone } from "@/components/attachments";
import { SmartTextarea } from "@/components/smart-textarea";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useWorkspaceActions, useWorkspaceUI } from "@/components/workspace/workspace-provider";
import { errorMessage } from "@/lib/api-client";
import { getTypeMeta, PRIORITY_META, STATUS_META } from "@/lib/task-meta";
import { cn } from "@/lib/utils";
import {
  getDefaultTaskType,
  getTaskTypeOptions,
  TASK_CATEGORY_OPTIONS,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskPriority,
  type TaskStatus,
  type TaskType,
} from "@/types/task";

function ChipSelect<Value extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: Value;
  onChange: (value: Value) => void;
  options: Array<{ value: Value; label: string; icon?: typeof Plus; tone?: string }>;
  ariaLabel: string;
}) {
  const current = options.find((option) => option.value === value);
  return (
    <Select value={value} onValueChange={(next) => next && onChange(next as Value)}>
      <SelectTrigger
        aria-label={ariaLabel}
        className="h-7 gap-1.5 rounded-full bg-card px-2.5 text-xs font-medium shadow-soft [&>svg:last-child]:size-3.5"
      >
        {current?.icon ? <current.icon className={cn("size-3.5", current.tone)} /> : null}
        {current?.label}
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="start">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.icon ? <option.icon className={option.tone} /> : null}
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface Draft {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: string;
  type: TaskType;
  subtasks: string[];
  files: File[];
}

const emptyDraft = (status: TaskStatus): Draft => ({
  title: "",
  description: "",
  status,
  priority: "medium",
  category: "trabalho",
  type: "feature",
  subtasks: [],
  files: [],
});

function CreateTaskForm({ initialStatus, onDone, onDirtyChange }: {
  initialStatus: TaskStatus;
  onDone: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const actions = useWorkspaceActions();
  const { openTask } = useWorkspaceUI();
  const toast = useToast();
  const [draft, setDraft] = useState(() => emptyDraft(initialStatus));
  const [subtaskDraft, setSubtaskDraft] = useState("");
  const [createMore, setCreateMore] = useState(false);
  const [saving, setSaving] = useState(false);

  const isDirty = Boolean(
    draft.title.trim() || draft.description.trim() || draft.subtasks.length || draft.files.length,
  );

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const update = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));

  const addSubtask = () => {
    const title = subtaskDraft.trim();
    if (!title) return;
    update({ subtasks: [...draft.subtasks, title] });
    setSubtaskDraft("");
  };

  const submit = async () => {
    const title = draft.title.trim();
    if (!title || saving) return;
    setSaving(true);
    try {
      const pendingSubtask = subtaskDraft.trim();
      const task = await actions.createTask(
        {
          title,
          description: draft.description.trim() || undefined,
          status: draft.status,
          priority: draft.priority,
          category: draft.category,
          type: draft.type,
          subtasks: pendingSubtask ? [...draft.subtasks, pendingSubtask] : draft.subtasks,
        },
        draft.files,
      );
      if (createMore) {
        setDraft({ ...emptyDraft(draft.status), category: draft.category, type: draft.type, priority: draft.priority });
        setSubtaskDraft("");
        toast.success("Tarefa criada", {
          action: { label: "Abrir", onClick: () => openTask(task.id) },
        });
      } else {
        onDone();
        toast.success("Tarefa criada", {
          action: { label: "Abrir", onClick: () => openTask(task.id) },
        });
      }
    } catch (error) {
      toast.error(errorMessage(error, "Não foi possível criar a tarefa."));
    } finally {
      setSaving(false);
    }
  };

  const typeOptions = getTaskTypeOptions(draft.category).map((option) => ({
    ...getTypeMeta(option.value),
    value: option.value,
  }));

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      onPaste={(event) => {
        const files = Array.from(event.clipboardData.files);
        if (event.defaultPrevented || !files.length) return;
        event.preventDefault();
        update({ files: [...draft.files, ...files] });
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
          event.preventDefault();
          void submit();
        }
      }}
      className="flex min-h-0 flex-col"
    >
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 pt-5 pb-4">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className="rounded-md bg-muted px-1.5 py-0.5">Tarefas</span>
          <span>›</span>
          <DialogTitle className="text-xs font-medium text-foreground">Nova tarefa</DialogTitle>
          <DialogDescription className="sr-only">Preencha os dados da nova tarefa.</DialogDescription>
        </div>

        <input
          autoFocus
          value={draft.title}
          onChange={(event) => update({ title: event.target.value })}
          placeholder="Título da tarefa"
          aria-label="Título"
          maxLength={200}
          disabled={saving}
          className="w-full bg-transparent text-xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/60"
        />

        <SmartTextarea
          value={draft.description}
          onValueChange={(description) => update({ description })}
          onPasteFiles={(files) => update({ files: [...draft.files, ...files] })}
          disabled={saving}
          placeholder="Adicione uma descrição… (/code ou /json criam blocos de código)"
          className="min-h-20 border-transparent bg-transparent px-0 shadow-none focus-visible:border-transparent focus-visible:ring-0"
        />

        <div className="flex flex-wrap items-center gap-1.5">
          <ChipSelect
            ariaLabel="Status"
            value={draft.status}
            onChange={(status) => update({ status })}
            options={TASK_STATUSES.map((value) => ({ value, ...STATUS_META[value] }))}
          />
          <ChipSelect
            ariaLabel="Prioridade"
            value={draft.priority}
            onChange={(priority) => update({ priority })}
            options={[...TASK_PRIORITIES].reverse().map((value) => ({ value, ...PRIORITY_META[value] }))}
          />
          <ChipSelect
            ariaLabel="Categoria"
            value={draft.category}
            onChange={(category) => update({ category, type: getDefaultTaskType(category) })}
            options={TASK_CATEGORY_OPTIONS.map((option) => ({ ...option, icon: FolderClosed, tone: "text-muted-foreground" }))}
          />
          <ChipSelect
            ariaLabel="Tipo"
            value={draft.type}
            onChange={(type) => update({ type })}
            options={typeOptions}
          />
        </div>

        <div className="rounded-xl border bg-subtle/60 p-2">
          {draft.subtasks.length ? (
            <ul className="mb-1 space-y-0.5">
              {draft.subtasks.map((subtask, index) => (
                <li key={`${subtask}-${index}`} className="group/item flex items-center gap-2 rounded-md px-2 py-1 text-sm">
                  <span className="size-3.5 shrink-0 rounded-[4px] border border-input" />
                  <span className="min-w-0 flex-1 truncate">{subtask}</span>
                  <button
                    type="button"
                    onClick={() => update({ subtasks: draft.subtasks.filter((_, item) => item !== index) })}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={`Remover ${subtask}`}
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="flex items-center gap-2 px-2">
            <Plus className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              value={subtaskDraft}
              onChange={(event) => setSubtaskDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.ctrlKey && !event.metaKey) {
                  event.preventDefault();
                  addSubtask();
                }
              }}
              placeholder="Adicionar subtarefa"
              aria-label="Nova subtarefa"
              maxLength={200}
              className="h-8 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <FileDropZone onFiles={(files) => update({ files: [...draft.files, ...files] })} disabled={saving}>
          {draft.files.length ? (
            <div className="flex flex-wrap gap-1.5">
              {draft.files.map((file, index) => (
                <span
                  key={`${file.name}-${index}`}
                  className="inline-flex max-w-56 items-center gap-1.5 rounded-full border bg-card py-1 pr-1 pl-2.5 text-xs shadow-soft"
                >
                  <Paperclip className="size-3 shrink-0 text-muted-foreground" />
                  <span className="truncate">{file.name || "arquivo"}</span>
                  <button
                    type="button"
                    onClick={() => update({ files: draft.files.filter((_, item) => item !== index) })}
                    className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
                    aria-label={`Remover ${file.name}`}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}
        </FileDropZone>
      </div>

      <div className="flex items-center gap-3 border-t bg-subtle/60 px-5 py-3">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground select-none">
          <input
            type="checkbox"
            checked={createMore}
            onChange={(event) => setCreateMore(event.target.checked)}
            className="size-3.5 accent-[var(--primary)]"
          />
          Criar outra
        </label>
        <div className="ml-auto flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onDone} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={!draft.title.trim() || saving}>
            {saving ? <LoaderCircle className="animate-spin" /> : null}
            Criar tarefa
            <Kbd className="hidden border-primary-foreground/30 sm:inline-flex">Ctrl ↵</Kbd>
          </Button>
        </div>
      </div>
    </form>
  );
}

export function CreateTaskDialog() {
  const { createTaskStatus, closeCreateTask } = useWorkspaceUI();
  const [dirty, setDirty] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [session, setSession] = useState(0);
  const [lastStatus, setLastStatus] = useState<TaskStatus>("not_started");
  if (createTaskStatus && createTaskStatus !== lastStatus) setLastStatus(createTaskStatus);

  const close = () => {
    setDirty(false);
    closeCreateTask();
    setSession((value) => value + 1);
  };

  return (
    <>
      <Dialog
        open={createTaskStatus !== null}
        onOpenChange={(open) => {
          if (open) return;
          if (dirty) setConfirmClose(true);
          else close();
        }}
      >
        <DialogContent className="top-[12dvh] flex max-h-[80dvh] max-w-2xl translate-y-0 flex-col gap-0 overflow-hidden p-0 max-sm:top-auto max-sm:bottom-0 max-sm:max-h-[92dvh] max-sm:w-full max-sm:rounded-b-none">
          <CreateTaskForm
            key={session}
            initialStatus={createTaskStatus ?? lastStatus}
            onDone={close}
            onDirtyChange={setDirty}
          />
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        title="Descartar rascunho?"
        description="A tarefa ainda não foi criada e o que você escreveu será perdido."
        confirmLabel="Descartar"
        cancelLabel="Continuar editando"
        onConfirm={close}
      />
    </>
  );
}
