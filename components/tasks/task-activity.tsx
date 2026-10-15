"use client";

import { useState } from "react";
import { ArrowRight, LoaderCircle, Sparkles, Trash2 } from "lucide-react";

import { RichText } from "@/components/rich-text";
import { SmartTextarea } from "@/components/smart-textarea";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProfileAvatar } from "@/components/workspace/profile-avatar";
import { useWorkspace, useWorkspaceActions } from "@/components/workspace/workspace-provider";
import { formatDateTime, formatRelative } from "@/lib/format";
import { STATUS_META } from "@/lib/task-meta";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";
import type { Task, TaskDescriptionHistory, TaskStatusHistory } from "@/types/task";

function RelativeTime({ value }: { value: string }) {
  const hydrated = useHydrated();
  return (
    <time dateTime={value} title={formatDateTime(value)} className="text-xs text-muted-foreground">
      {hydrated ? formatRelative(value) : formatDateTime(value)}
    </time>
  );
}

function Comments({ task }: { task: Task }) {
  const { profile } = useWorkspace();
  const actions = useWorkspaceActions();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    const ok = await actions.addComment(task.id, content);
    setSending(false);
    if (ok) setDraft("");
  };

  return (
    <div className="space-y-4">
      {task.comments.length ? (
        <ul className="space-y-4">
          {task.comments.map((comment) => (
            <li key={comment.id} className="group/comment flex gap-3">
              <ProfileAvatar profile={profile} className="size-7" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{profile.nickname}</span>
                  <RelativeTime value={comment.created_at} />
                  <button
                    type="button"
                    onClick={() => void actions.deleteComment(task.id, comment.id)}
                    className="ml-auto inline-flex size-6 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity group-hover/comment:opacity-100 hover:text-destructive focus-visible:opacity-100 pointer-coarse:opacity-100"
                    aria-label="Excluir comentário"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <RichText content={comment.content} className="mt-0.5 text-sm" />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhum comentário ainda.</p>
      )}

      <div className="flex gap-3">
        <ProfileAvatar profile={profile} className="size-7" />
        <div className="min-w-0 flex-1">
          <SmartTextarea
            value={draft}
            onValueChange={setDraft}
            onSubmit={() => void submit()}
            placeholder="Escreva um comentário…"
            rows={2}
            maxLength={4000}
            className="min-h-16"
          />
          <div className="mt-2 flex items-center justify-end gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">Ctrl + Enter para enviar</span>
            <Button size="sm" onClick={() => void submit()} disabled={!draft.trim() || sending}>
              {sending ? <LoaderCircle className="animate-spin" /> : null}
              Comentar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getHistory(task: Task): TaskStatusHistory[] {
  return task.status_history.length
    ? task.status_history
    : [{ id: "created", task_id: task.id, from_status: null, to_status: task.status, changed_at: task.created_at }];
}

function History({ task }: { task: Task }) {
  const history = [...getHistory(task)].reverse();

  return (
    <ol className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-px before:bg-border">
      {history.map((event) => {
        const to = STATUS_META[event.to_status];
        return (
          <li key={event.id} className="relative flex items-start gap-3">
            <span className="relative z-10 grid size-6 shrink-0 place-items-center rounded-full border bg-popover">
              {event.from_status ? (
                <to.icon className={cn("size-3.5", to.tone)} />
              ) : (
                <Sparkles className="size-3.5 text-primary" />
              )}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="flex flex-wrap items-center gap-1.5 text-sm">
                {event.from_status ? (
                  <>
                    <span className="text-muted-foreground">{STATUS_META[event.from_status].label}</span>
                    <ArrowRight className="size-3.5 text-muted-foreground" />
                    <span className="font-medium">{to.label}</span>
                  </>
                ) : (
                  <span className="font-medium">Tarefa criada</span>
                )}
              </p>
              <RelativeTime value={event.changed_at} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function TaskActivity({ task }: { task: Task }) {
  const [tab, setTab] = useState<"comments" | "history">("comments");

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Atividade</h3>
        <SegmentedControl
          label="Atividade"
          value={tab}
          onChange={setTab}
          options={[
            { value: "comments", label: `Comentários${task.comments.length ? ` · ${task.comments.length}` : ""}` },
            { value: "history", label: "Histórico" },
          ]}
        />
      </div>
      {tab === "comments" ? <Comments task={task} /> : <History task={task} />}
    </div>
  );
}

export function DescriptionHistoryDialog({
  task,
  open,
  onOpenChange,
}: {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const actions = useWorkspaceActions();
  const [pending, setPending] = useState<TaskDescriptionHistory | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Histórico da descrição</DialogTitle>
          <DialogDescription>{task.title}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {task.description_history.map((revision) => (
            <section key={revision.id} className="rounded-xl border bg-card p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-muted-foreground">
                  {formatDateTime(revision.changed_at)}
                </span>
                <Button variant="outline" size="xs" onClick={() => setPending(revision)}>
                  Restaurar
                </Button>
              </div>
              {revision.description ? (
                <RichText content={revision.description} className="text-sm" collapsibleCode />
              ) : (
                <p className="text-sm text-muted-foreground italic">Sem descrição</p>
              )}
            </section>
          ))}
        </div>
      </DialogContent>
      <ConfirmDialog
        open={Boolean(pending)}
        onOpenChange={(next) => !next && setPending(null)}
        title="Restaurar esta versão?"
        description="A descrição atual será guardada no histórico."
        confirmLabel="Restaurar"
        destructive={false}
        onConfirm={async () => {
          if (pending) await actions.restoreDescription(task.id, pending.id);
          onOpenChange(false);
        }}
      />
    </Dialog>
  );
}
