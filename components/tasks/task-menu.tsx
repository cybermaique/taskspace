"use client";

import { ArrowUpRight, Copy, Flag, MoveRight, Trash2 } from "lucide-react";

import {
  MenuContent,
  MenuItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSub,
  MenuSubTrigger,
} from "@/components/ui/menu";
import { useToast } from "@/components/ui/toast";
import { useWorkspaceActions, useWorkspaceUI } from "@/components/workspace/workspace-provider";
import { PRIORITY_META, STATUS_META } from "@/lib/task-meta";
import { TASK_PRIORITIES, TASK_STATUSES, type Task } from "@/types/task";
import { useI18n } from "@/components/i18n-provider";

/** Shared action list for a task's "more" button and its right-click menu. */
export function TaskMenuContent({ task }: { task: Task }) {
  const { t } = useI18n();
  const actions = useWorkspaceActions();
  const { openTask } = useWorkspaceUI();
  const toast = useToast();

  return (
    <MenuContent className="w-52">
      <MenuItem onClick={() => openTask(task.id)}>
        <ArrowUpRight />{t("Abrir")}</MenuItem>
      <MenuSub>
        <MenuSubTrigger>
          <MoveRight />{t("Mover para")}</MenuSubTrigger>
        <MenuContent side="right" align="start" sideOffset={4} className="w-48">
          <MenuRadioGroup
            value={task.status}
            onValueChange={(value) => actions.moveTask(task.id, value as Task["status"], null)}
          >
            {TASK_STATUSES.map((status) => {
              const meta = STATUS_META[status];
              return (
                <MenuRadioItem key={status} value={status}>
                  <meta.icon className={meta.tone} />
                  {t(meta.label)}
                </MenuRadioItem>
              );
            })}
          </MenuRadioGroup>
        </MenuContent>
      </MenuSub>
      <MenuSub>
        <MenuSubTrigger>
          <Flag />{t("Prioridade")}</MenuSubTrigger>
        <MenuContent side="right" align="start" sideOffset={4} className="w-40">
          <MenuRadioGroup
            value={task.priority}
            onValueChange={(value) =>
              void actions.updateTask(task.id, { priority: value as Task["priority"] })
            }
          >
            {[...TASK_PRIORITIES].reverse().map((priority) => {
              const meta = PRIORITY_META[priority];
              return (
                <MenuRadioItem key={priority} value={priority}>
                  <meta.icon className={meta.tone} />
                  {t(meta.label)}
                </MenuRadioItem>
              );
            })}
          </MenuRadioGroup>
        </MenuContent>
      </MenuSub>
      <MenuItem
        onClick={() =>
          void navigator.clipboard
            .writeText(task.description ? `${task.title}\n\n${task.description}` : task.title)
            .then(() => toast.success(t("Tarefa copiada")))
        }
      >
        <Copy />{t("Copiar texto")}</MenuItem>
      <MenuSeparator />
      <MenuItem destructive onClick={() => void actions.deleteTask(task.id)}>
        <Trash2 />{t("Excluir")}</MenuItem>
    </MenuContent>
  );
}
