"use client";

import { Columns3, ListFilter, Rows3, Search, X } from "lucide-react";

import type { TaskFilters, TaskLayout } from "@/components/tasks/use-task-filters";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-picker";
import { Kbd } from "@/components/ui/kbd";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from "@/components/ui/menu";
import { PRIORITY_META } from "@/lib/task-meta";
import { cn } from "@/lib/utils";
import { TASK_PRIORITIES, type TaskPriority, type TaskView } from "@/types/task";
import { useI18n } from "@/components/i18n-provider";

export const TASK_SEARCH_INPUT_ID = "task-search";

const SCOPES: Array<{ value: TaskView; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "work", label: "Trabalho" },
  { value: "personal", label: "Pessoal" },
  { value: "study", label: "Estudos" },
  { value: "travel", label: "Viagem" },
];

export function TaskToolbar({
  filters,
  setFilter,
  setRange,
  reset,
  activeCount,
  layout,
  setLayout,
  resultCount,
}: {
  filters: TaskFilters;
  setFilter: <Key extends keyof TaskFilters>(key: Key, value: TaskFilters[Key]) => void;
  setRange: (from: string, to: string) => void;
  reset: () => void;
  activeCount: number;
  layout: TaskLayout;
  setLayout: (layout: TaskLayout) => void;
  resultCount: number;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-0 basis-full sm:max-w-xs sm:flex-1 sm:basis-auto">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id={TASK_SEARCH_INPUT_ID}
            value={filters.search}
            onChange={(event) => setFilter("search", event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setFilter("search", "");
                event.currentTarget.blur();
              }
            }}
            placeholder={t("Filtrar tarefas…")}
            aria-label={t("Filtrar tarefas")}
            className="h-8 w-full rounded-lg border border-input bg-card pr-8 pl-8 text-base shadow-soft outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 sm:text-[0.8125rem]"
          />
          {filters.search ? (
            <button
              type="button"
              onClick={() => setFilter("search", "")}
              className="absolute top-1/2 right-1.5 inline-flex size-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:text-foreground"
              aria-label={t("Limpar busca")}
            >
              <X className="size-3.5" />
            </button>
          ) : (
            <Kbd className="absolute top-1/2 right-2 hidden -translate-y-1/2 text-muted-foreground sm:inline-flex">
              /
            </Kbd>
          )}
        </label>

        <Menu>
          <MenuTrigger
            render={
              <Button variant="outline" size="sm" className={cn(filters.priority !== "all" && "border-primary/40 text-primary")} />
            }
          >
            <ListFilter />
            {filters.priority === "all" ? t("Prioridade") : t(PRIORITY_META[filters.priority].label)}
          </MenuTrigger>
          <MenuContent className="w-44">
            <MenuGroup>
              <MenuLabel>{t("Prioridade")}</MenuLabel>
              <MenuRadioGroup
                value={filters.priority}
                onValueChange={(value) => setFilter("priority", value as TaskPriority | "all")}
              >
                <MenuRadioItem value="all">{t("Todas")}</MenuRadioItem>
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
            </MenuGroup>
          </MenuContent>
        </Menu>

        <div className="w-52 max-sm:flex-1">
          <DateRangePicker
            from={filters.from || null}
            to={filters.to || null}
            onChange={setRange}
            placeholder={t("Criadas em…")}
            compact
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          {activeCount > 0 ? (
            <Button variant="ghost" size="sm" onClick={reset}>
              <X />{t("Limpar")}<span className="text-muted-foreground tabular-nums">· {resultCount}</span>
            </Button>
          ) : null}
          <SegmentedControl
            label={t("Modo de visualização")}
            value={layout}
            onChange={setLayout}
            options={[
              {
                value: "board",
                title: t("Quadro"),
                label: (
                  <span className="inline-flex items-center gap-1.5">
                    <Columns3 className="size-4" />
                    <span className="hidden md:inline">{t("Quadro")}</span>
                  </span>
                ),
              },
              {
                value: "list",
                title: t("Lista"),
                label: (
                  <span className="inline-flex items-center gap-1.5">
                    <Rows3 className="size-4" />
                    <span className="hidden md:inline">{t("Lista")}</span>
                  </span>
                ),
              },
            ]}
          />
        </div>
      </div>

      <SegmentedControl
        label={t("Escopo")}
        value={filters.scope}
        onChange={(scope) => setFilter("scope", scope)}
        options={SCOPES.map((option) => ({ ...option, label: t(option.label) }))}
        className="scrollbar-none max-w-full overflow-x-auto"
      />
    </div>
  );
}
