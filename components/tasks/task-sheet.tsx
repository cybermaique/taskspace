"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import {
  Calendar,
  CheckCheck,
  CircleDashed,
  Ellipsis,
  FolderClosed,
  History,
  Link2,
  LoaderCircle,
  Pencil,
  Shapes,
  SignalHigh,
  Trash2,
} from "lucide-react";

import { AttachmentGrid, AttachmentViewer, FileDropZone, sortAttachments } from "@/components/attachments";
import { RichText } from "@/components/rich-text";
import { SmartTextarea } from "@/components/smart-textarea";
import { DescriptionHistoryDialog, TaskActivity } from "@/components/tasks/task-activity";
import { TaskSubtasks } from "@/components/tasks/task-subtasks";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { SheetContent } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";
import {
  useWorkspace,
  useWorkspaceActions,
  useWorkspaceUI,
} from "@/components/workspace/workspace-provider";

import { getTypeMeta, PRIORITY_META, STATUS_META } from "@/lib/task-meta";
import { cn } from "@/lib/utils";
import {
  getDefaultTaskType,
  getTaskCategoryLabel,
  getTaskTypeOptions,
  TASK_CATEGORY_OPTIONS,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Task,
  type TaskAttachment,
} from "@/types/task";
import { useI18n } from "@/components/i18n-provider";
import { useFormat } from "@/lib/use-format";

/* ── building blocks ───────────────────────────────────── */

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-t py-5 first:border-t-0">
      <div className="mb-3 flex min-h-7 items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function PropertyRow({ icon: Icon, label, children }: { icon: typeof Calendar; label: string; children: ReactNode }) {
  return (
    <>
      <dt className="flex h-8 items-center gap-2 text-[0.8125rem] text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </dt>
      <dd className="flex min-h-8 min-w-0 items-center text-[0.8125rem]">{children}</dd>
    </>
  );
}

function PropertySelect<Value extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: Value;
  onChange: (value: Value) => void;
  options: Array<{ value: Value; label: string; icon?: typeof Calendar; tone?: string }>;
  ariaLabel: string;
}) {
  const { t } = useI18n();
  const current = options.find((option) => option.value === value);
  return (
    <Select value={value} onValueChange={(next) => next && next !== value && onChange(next as Value)}>
      <SelectTrigger
        aria-label={ariaLabel}
        className="-ml-2 h-8 w-auto max-w-full gap-2 border-transparent bg-transparent px-2 font-medium shadow-none hover:bg-accent dark:bg-transparent dark:hover:bg-accent [&>svg:last-child]:opacity-0 hover:[&>svg:last-child]:opacity-100"
      >
        {current?.icon ? <current.icon className={cn("size-4", current.tone)} /> : null}
        <span className="truncate">{current ? t(current.label) : "—"}</span>
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="start">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.icon ? <option.icon className={option.tone} /> : null}
            {t(option.label)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ── editable pieces ───────────────────────────────────── */

function EditableTitle({ task }: { task: Task }) {
  const { t } = useI18n();
  const actions = useWorkspaceActions();
  const [value, setValue] = useState(task.title);

  useEffect(() => {
    // Keep in sync when the title changes elsewhere (e.g. command palette, undo).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(task.title);
  }, [task.title]);

  const commit = () => {
    const title = value.trim();
    if (!title) setValue(task.title);
    else if (title !== task.title) void actions.updateTask(task.id, { title });
  };

  return (
    <textarea
      value={value}
      onChange={(event) => setValue(event.target.value.replace(/\n/g, ""))}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          event.currentTarget.blur();
        }
        if (event.key === "Escape") {
          setValue(task.title);
        }
      }}
      rows={1}
      maxLength={200}
      aria-label={t("Título da tarefa")}
      className="field-sizing-content -mx-2 w-[calc(100%+1rem)] resize-none rounded-lg bg-transparent px-2 py-1 text-xl leading-snug font-semibold tracking-tight outline-none hover:bg-accent/50 focus-visible:bg-accent/50 sm:text-2xl"
    />
  );
}

function DescriptionEditor({
  task,
  onDirtyChange,
}: {
  task: Task;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const { t } = useI18n();
  const actions = useWorkspaceActions();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.description ?? "");
  const [saving, setSaving] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const dirty = editing && draft !== (task.description ?? "");

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  const save = async () => {
    setSaving(true);
    const ok = await actions.updateTask(task.id, { description: draft.trim() || null });
    setSaving(false);
    if (ok) setEditing(false);
  };

  const startEditing = () => {
    setDraft(task.description ?? "");
    setEditing(true);
  };

  return (
    <Section
      title={t("Descrição")}
      action={
        <div className="flex items-center gap-1">
          {task.description_history.length ? (
            <Tooltip content={t("Histórico da descrição")}>
              <Button variant="ghost" size="icon-xs" onClick={() => setHistoryOpen(true)} aria-label={t("Histórico da descrição")}>
                <History />
              </Button>
            </Tooltip>
          ) : null}
          {!editing ? (
            <Button variant="ghost" size="xs" onClick={startEditing}>
              <Pencil />{t("Editar")}</Button>
          ) : null}
        </div>
      }
    >
      {editing ? (
        <div className="space-y-2">
          <SmartTextarea
            autoFocus
            value={draft}
            onValueChange={setDraft}
            onSubmit={() => void save()}
            onCancel={() => setEditing(false)}
            disabled={saving}
            placeholder={t("Detalhes, links, blocos de código (digite /code ou /json)…")}
            className="min-h-32"
          />
          <div className="flex items-center justify-end gap-2">
            <span className="mr-auto hidden text-xs text-muted-foreground sm:inline">{t("Ctrl + Enter salva · Esc cancela")}</span>
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={saving}>{t("Cancelar")}</Button>
            <Button size="sm" onClick={() => void save()} disabled={saving || !dirty}>
              {saving ? <LoaderCircle className="animate-spin" /> : null}{t("Salvar")}</Button>
          </div>
        </div>
      ) : task.description ? (
        <div onDoubleClick={startEditing}>
          <RichText content={task.description} className="text-sm text-foreground/90" collapsibleCode />
        </div>
      ) : (
        <button
          type="button"
          onClick={startEditing}
          className="w-full rounded-lg border border-dashed px-3 py-4 text-left text-sm text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
        >{t("Adicionar uma descrição…")}</button>
      )}
      <DescriptionHistoryDialog task={task} open={historyOpen} onOpenChange={setHistoryOpen} />
    </Section>
  );
}

function AttachmentsSection({ task }: { task: Task }) {
  const { t } = useI18n();
  const actions = useWorkspaceActions();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TaskAttachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const attachments = sortAttachments(task.attachments);
  const urlFor = (attachment: TaskAttachment) => `/api/tasks/${task.id}/attachments/${attachment.id}`;

  const upload = async (files: File[]) => {
    setUploading(true);
    await actions.addAttachments(task.id, files);
    setUploading(false);
  };

  return (
    <Section
      title={`${t("Anexos")}${attachments.length ? ` · ${attachments.length}` : ""}`}
      action={uploading ? <LoaderCircle className="size-4 animate-spin text-muted-foreground" /> : null}
    >
      <FileDropZone onFiles={(files) => void upload(files)} disabled={uploading}>
        {attachments.length ? (
          <AttachmentGrid
            attachments={attachments}
            urlFor={urlFor}
            onOpen={(index) => {
              setViewerIndex(index);
              actions.markAttachmentViewed(task.id, attachments[index].id);
            }}
            onDelete={setPendingDelete}
          />
        ) : null}
      </FileDropZone>
      <AttachmentViewer
        attachments={attachments}
        index={viewerIndex}
        urlFor={urlFor}
        onIndexChange={setViewerIndex}
        onClose={() => setViewerIndex(null)}
      />
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={t("Remover anexo?")}
        description={t("\"{name}\" será excluído permanentemente.", { name: pendingDelete?.file_name ?? "" })}
        confirmLabel={t("Remover")}
        onConfirm={async () => {
          if (pendingDelete) await actions.deleteAttachment(task.id, pendingDelete.id);
        }}
      />
    </Section>
  );
}

/* ── sheet ─────────────────────────────────────────────── */

function TaskSheetBody({
  task,
  onDirtyChange,
  scrollRef,
}: {
  task: Task;
  onDirtyChange: (dirty: boolean) => void;
  scrollRef: RefObject<HTMLDivElement | null>;
}) {
  const { formatDateTime } = useFormat();
  const { t, locale } = useI18n();
  const actions = useWorkspaceActions();
  const toast = useToast();
  const status = STATUS_META[task.status];
  const typeOptions = getTaskTypeOptions(task.category).map((option) => ({
    value: option.value,
    label: option.label,
    icon: getTypeMeta(option.value).icon,
    tone: getTypeMeta(option.value).tone,
  }));

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      onPaste={(event) => {
        const target = event.target as HTMLElement;
        const files = Array.from(event.clipboardData.files);
        if (!files.length || target.closest("textarea, input")) return;
        event.preventDefault();
        void actions.addAttachments(task.id, files);
      }}
    >
      <div className="flex h-14 shrink-0 items-center gap-2 border-b pr-14 pl-4 sm:pl-6">
        <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", status.tone)}>
          <status.icon className="size-4" />
          {t(status.label)}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <Tooltip content={t("Copiar link")}>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("Copiar link da tarefa")}
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set("task", task.id);
                void navigator.clipboard.writeText(url.toString()).then(() => toast.success(t("Link copiado")));
              }}
            >
              <Link2 />
            </Button>
          </Tooltip>
          <Menu>
            <MenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={t("Mais ações")} />}>
              <Ellipsis />
            </MenuTrigger>
            <MenuContent align="end" className="w-44">
              <MenuItem destructive onClick={() => void actions.deleteTask(task.id)}>
                <Trash2 />{t("Excluir tarefa")}</MenuItem>
            </MenuContent>
          </Menu>
        </div>
      </div>

      <div ref={scrollRef} tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto px-4 pb-10 outline-none sm:px-6">
        <div className="pt-5">
          <DialogTitle className="sr-only">{task.title}</DialogTitle>
          <DialogDescription className="sr-only">{t("Detalhes da tarefa")}</DialogDescription>
          <EditableTitle task={task} />

          <dl className="mt-4 grid grid-cols-[8rem_minmax(0,1fr)] gap-x-3 gap-y-1">
            <PropertyRow icon={CircleDashed} label={t("Status")}>
              <PropertySelect
                ariaLabel={t("Status")}
                value={task.status}
                onChange={(next) => actions.moveTask(task.id, next, null)}
                options={TASK_STATUSES.map((value) => ({ value, ...STATUS_META[value] }))}
              />
            </PropertyRow>
            <PropertyRow icon={SignalHigh} label={t("Prioridade")}>
              <PropertySelect
                ariaLabel={t("Prioridade")}
                value={task.priority}
                onChange={(priority) => void actions.updateTask(task.id, { priority })}
                options={[...TASK_PRIORITIES].reverse().map((value) => ({ value, ...PRIORITY_META[value] }))}
              />
            </PropertyRow>
            <PropertyRow icon={FolderClosed} label={t("Categoria")}>
              <PropertySelect
                ariaLabel={t("Categoria")}
                value={task.category ?? "trabalho"}
                onChange={(category) =>
                  void actions.updateTask(task.id, { category, type: getDefaultTaskType(category) })
                }
                options={TASK_CATEGORY_OPTIONS.map((option) => ({ ...option }))}
              />
            </PropertyRow>
            <PropertyRow icon={Shapes} label={t("Tipo")}>
              <PropertySelect
                ariaLabel={t("Tipo")}
                value={task.type}
                onChange={(type) => void actions.updateTask(task.id, { type })}
                options={typeOptions}
              />
            </PropertyRow>
            <PropertyRow icon={Calendar} label={t("Criada")}>
              <span className="text-muted-foreground">{formatDateTime(task.created_at)}</span>
            </PropertyRow>
            {task.completed_at ? (
              <PropertyRow icon={CheckCheck} label={t("Concluída")}>
                <span className="text-muted-foreground">{formatDateTime(task.completed_at)}</span>
              </PropertyRow>
            ) : null}
          </dl>
          {task.category && !TASK_CATEGORY_OPTIONS.some((option) => option.value === task.category) ? (
            <p className="mt-1 text-xs text-muted-foreground">{t("Categoria atual:")}{" "}{getTaskCategoryLabel(task.category, locale)}
            </p>
          ) : null}
        </div>

        <div className="mt-2">
          <DescriptionEditor task={task} onDirtyChange={onDirtyChange} />
          <Section title={t("Subtarefas")}>
            <TaskSubtasks task={task} />
          </Section>
          <AttachmentsSection task={task} />
          <section className="border-t py-5">
            <TaskActivity task={task} />
          </section>
        </div>
      </div>
    </div>
  );
}

export function TaskSheet() {
  const { t } = useI18n();
  const { tasks } = useWorkspace();
  const { activeTaskId, openTask } = useWorkspaceUI();
  const task = tasks.find((item) => item.id === activeTaskId) ?? null;
  // Keep rendering the last task while the panel animates closed.
  const [lastTask, setLastTask] = useState<Task | null>(task);
  if (task && task !== lastTask) setLastTask(task);
  const shown = task ?? lastTask;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dirty, setDirty] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const close = () => {
    setDirty(false);
    openTask(null);
  };

  return (
    <>
      <Dialog
        open={Boolean(task)}
        onOpenChange={(open) => {
          if (open) return;
          if (dirty) setConfirmClose(true);
          else close();
        }}
      >
        <SheetContent initialFocus={scrollRef}>
          {shown ? (
            <TaskSheetBody key={shown.id} task={shown} onDirtyChange={setDirty} scrollRef={scrollRef} />
          ) : null}
        </SheetContent>
      </Dialog>
      <ConfirmDialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        title={t("Descartar alterações?")}
        description={t("A descrição tem alterações que ainda não foram salvas.")}
        confirmLabel={t("Descartar")}
        cancelLabel={t("Continuar editando")}
        onConfirm={close}
      />
    </>
  );
}
