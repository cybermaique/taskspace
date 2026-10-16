"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, RotateCcw, SquareKanban, StickyNote, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { useWorkspaceActions, useWorkspaceUI } from "@/components/workspace/workspace-provider";
import { errorMessage } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import type { Note } from "@/types/note";
import type { Task } from "@/types/task";

interface TrashItem {
  id: string;
  kind: "task" | "note";
  title: string;
  deletedAt: string | null;
}

function toItems(tasks: Task[], notes: Note[]): TrashItem[] {
  return [
    ...tasks.map((task) => ({ id: task.id, kind: "task" as const, title: task.title, deletedAt: task.deleted_at })),
    ...notes.map((note) => ({ id: note.id, kind: "note" as const, title: note.title, deletedAt: note.deleted_at })),
  ].sort((left, right) => new Date(right.deletedAt ?? 0).getTime() - new Date(left.deletedAt ?? 0).getTime());
}

function TrashList() {
  const actions = useWorkspaceActions();
  const toast = useToast();
  const [items, setItems] = useState<TrashItem[] | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    actions
      .loadTrash()
      .then(({ tasks, notes }) => active && setItems(toItems(tasks, notes)))
      .catch((error) => {
        if (!active) return;
        setItems([]);
        toast.error(errorMessage(error, "Não foi possível abrir a lixeira."));
      });
    return () => {
      active = false;
    };
  }, [actions, toast]);

  const restore = async (item: TrashItem) => {
    setRestoring(item.id);
    await (item.kind === "task" ? actions.restoreTask(item.id) : actions.restoreNote(item.id));
    setRestoring(null);
    setItems((current) => current?.filter((entry) => entry.id !== item.id) ?? null);
  };

  if (!items) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="skeleton h-12 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="grid place-items-center py-10 text-center">
        <Trash2 className="size-8 text-muted-foreground/50" />
        <p className="mt-3 text-sm text-muted-foreground">A lixeira está vazia.</p>
      </div>
    );
  }

  return (
    <ul className="-mx-1 max-h-[55dvh] space-y-0.5 overflow-y-auto">
      {items.map((item) => {
        const Icon = item.kind === "task" ? SquareKanban : StickyNote;
        return (
          <li key={`${item.kind}-${item.id}`} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent/60">
            <Icon className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                {item.kind === "task" ? "Tarefa" : "Anotação"} · excluída em {formatDateTime(item.deletedAt)}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void restore(item)} disabled={restoring === item.id}>
              {restoring === item.id ? <LoaderCircle className="animate-spin" /> : <RotateCcw />}
              Restaurar
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

export function TrashDialog() {
  const { trashOpen, setTrashOpen } = useWorkspaceUI();
  return (
    <Dialog open={trashOpen} onOpenChange={setTrashOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Lixeira</DialogTitle>
          <DialogDescription>Itens excluídos ficam aqui até você restaurá-los.</DialogDescription>
        </DialogHeader>
        {trashOpen ? <TrashList /> : null}
      </DialogContent>
    </Dialog>
  );
}
