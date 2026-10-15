"use client";

import { useState } from "react";
import { CornerDownLeft, LoaderCircle, Plus } from "lucide-react";

import { useToast } from "@/components/ui/toast";
import { useWorkspaceActions } from "@/components/workspace/workspace-provider";
import { errorMessage } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { CreateTaskInput, TaskStatus } from "@/types/task";

/** Inline "add a task" row at the bottom of a board column or list group. */
export function QuickAdd({
  status,
  defaults,
  className,
}: {
  status: TaskStatus;
  defaults: Partial<CreateTaskInput>;
  className?: string;
}) {
  const actions = useWorkspaceActions();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const value = title.trim();
    if (!value || saving) return;
    setSaving(true);
    try {
      await actions.createTask({ ...defaults, title: value, status });
      setTitle("");
    } catch (error) {
      toast.error(errorMessage(error, "Não foi possível criar a tarefa."));
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
          className,
        )}
      >
        <Plus className="size-4" />
        Adicionar tarefa
      </button>
    );
  }

  return (
    <div className={cn("rounded-xl border bg-card p-2 shadow-soft ring-3 ring-ring/40", className)}>
      <input
        autoFocus
        value={title}
        disabled={saving}
        maxLength={200}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void submit();
          }
          if (event.key === "Escape") {
            setTitle("");
            setOpen(false);
          }
        }}
        onBlur={() => {
          if (!title.trim() && !saving) setOpen(false);
        }}
        placeholder="Título da tarefa"
        aria-label="Título da nova tarefa"
        className="w-full bg-transparent px-1 py-1 text-sm outline-none placeholder:text-muted-foreground"
      />
      <div className="mt-1 flex items-center justify-between px-1 text-[0.7rem] text-muted-foreground">
        <span>Esc para cancelar</span>
        <span className="inline-flex items-center gap-1">
          {saving ? <LoaderCircle className="size-3 animate-spin" /> : <CornerDownLeft className="size-3" />}
          Enter para criar
        </span>
      </div>
    </div>
  );
}
