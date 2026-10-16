"use client";

import { Plus, SquareKanban } from "lucide-react";

import { TaskBoard } from "@/components/tasks/task-board";
import { TaskListView } from "@/components/tasks/task-list-view";
import { TaskStats } from "@/components/tasks/task-stats";
import { TaskToolbar } from "@/components/tasks/task-toolbar";
import { useTaskFilters } from "@/components/tasks/use-task-filters";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/workspace/app-shell";
import { useWorkspace, useWorkspaceUI } from "@/components/workspace/workspace-provider";
import { useHydrated } from "@/lib/use-hydrated";
import type { CreateTaskInput, TaskView } from "@/types/task";
import { useI18n } from "@/components/i18n-provider";

const SCOPE_DEFAULTS: Record<TaskView, Partial<CreateTaskInput>> = {
  all: { category: "trabalho", type: "feature" },
  work: { category: "trabalho", type: "feature" },
  personal: { category: "pessoal", type: "personal" },
  study: { category: "pessoal", type: "study" },
  travel: { category: "pessoal", type: "travel" },
};

function greeting(hour: number) {
  if (hour < 5) return "Boa madrugada";
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function TasksView() {
  const { t } = useI18n();
  const { tasks, profile } = useWorkspace();
  const { openCreateTask } = useWorkspaceUI();
  const hydrated = useHydrated();
  const filterState = useTaskFilters(tasks);
  const { filtered, layout, filters, activeCount, reset } = filterState;
  const compact = profile.display_mode === "compact";
  const defaults = SCOPE_DEFAULTS[filters.scope];
  const inProgress = tasks.filter((task) => task.status === "in_progress").length;
  const firstName = profile.nickname.split(" ")[0];

  return (
    <div className="mx-auto w-full max-w-[110rem]">
      <PageHeader
        title={t("Tarefas")}
        description={
          <>
            {hydrated ? t(greeting(new Date().getHours())) : t("Olá")}, {firstName}.{" "}
            {inProgress
              ? `${inProgress} ${inProgress === 1 ? t("tarefa em andamento") : t("tarefas em andamento")}.`
              : t("Nada em andamento agora.")}
          </>
        }
      />

      <div className="space-y-5 px-4 pt-5 sm:px-6 lg:px-8">
        {!compact ? <TaskStats tasks={tasks} /> : null}

        <TaskToolbar {...filterState} resultCount={filtered.length} />

        {tasks.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed bg-card/50 px-6 py-16 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-primary">
              <SquareKanban className="size-6" />
            </span>
            <h2 className="mt-4 text-base font-semibold">{t("Seu quadro está vazio")}</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t("Crie a primeira tarefa e organize o fluxo arrastando entre as colunas.")}</p>
            <Button className="mt-5" onClick={() => openCreateTask()}>
              <Plus />{t("Criar tarefa")}</Button>
          </div>
        ) : filtered.length === 0 && activeCount > 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed px-6 py-14 text-center">
            <p className="text-sm font-medium">{t("Nenhuma tarefa com esses filtros")}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={reset}>{t("Limpar filtros")}</Button>
          </div>
        ) : layout === "board" ? (
          <TaskBoard tasks={filtered} compact={compact} defaults={defaults} />
        ) : (
          <TaskListView tasks={filtered} defaults={defaults} />
        )}
      </div>
    </div>
  );
}
