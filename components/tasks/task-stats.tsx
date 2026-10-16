"use client";

import { useMemo } from "react";

import { Tooltip } from "@/components/ui/tooltip";

import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/task";
import { useI18n } from "@/components/i18n-provider";
import { useFormat } from "@/lib/use-format";

const DAY_MS = 86_400_000;

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

function useStats(tasks: Task[]) {
  return useMemo(() => {
    const today = startOfToday();
    const days = Array.from({ length: 14 }, (_, index) => ({
      start: today - (13 - index) * DAY_MS,
      count: 0,
    }));

    let thisWeek = 0;
    let lastWeek = 0;
    for (const task of tasks) {
      if (task.status !== "completed" || !task.completed_at) continue;
      const time = new Date(task.completed_at).getTime();
      const dayIndex = Math.floor((time - days[0].start) / DAY_MS);
      if (dayIndex >= 0 && dayIndex < 14) days[dayIndex].count += 1;
      if (time >= today - 6 * DAY_MS) thisWeek += 1;
      else if (time >= today - 13 * DAY_MS) lastWeek += 1;
    }

    return {
      open: tasks.filter((task) => task.status === "not_started").length,
      inProgress: tasks.filter((task) => task.status === "in_progress").length,
      waiting: tasks.filter((task) => task.status === "waiting").length,
      thisWeek,
      delta: thisWeek - lastWeek,
      days,
    };
  }, [tasks]);
}

function StatTile({
  label,
  value,
  dot,
  children,
}: {
  label: string;
  value: number;
  dot?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col justify-between gap-2 rounded-xl border bg-card p-3.5 shadow-soft">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {dot ? <span className={cn("size-1.5 rounded-full", dot)} aria-hidden="true" /> : null}
        {label}
      </div>
      <div className="flex items-end justify-between gap-3">
        <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
        {children}
      </div>
    </div>
  );
}

/** 14-day completion sparkline: past days de-emphasized, today in the accent. */
function CompletionSparkline({ days }: { days: Array<{ start: number; count: number }> }) {
  const { formatShortDate } = useFormat();
  const { t } = useI18n();
  const max = Math.max(1, ...days.map((day) => day.count));
  const height = 32;

  return (
    <div
      className="flex h-8 items-end gap-0.5"
      role="img"
      aria-label={t("Conclusões nos últimos 14 dias: {counts}", { counts: days.map((day) => day.count).join(", ") })}
    >
      {days.map((day, index) => {
        const isToday = index === days.length - 1;
        const barHeight = day.count ? Math.max(4, (day.count / max) * height) : 2;
        const label = `${isToday ? t("Hoje") : formatShortDate(new Date(day.start).toISOString())}: ${day.count} ${day.count === 1 ? t("concluída") : t("concluídas")}`;
        return (
          <Tooltip key={day.start} content={label} side="top">
            <span className="flex h-full w-[7px] cursor-default items-end">
              <span
                className={cn(
                  "w-full rounded-t-[3px]",
                  isToday ? "bg-primary" : "bg-muted-foreground/30",
                  !day.count && "bg-border",
                )}
                style={{ height: barHeight }}
              />
            </span>
          </Tooltip>
        );
      })}
    </div>
  );
}

export function TaskStats({ tasks }: { tasks: Task[] }) {
  const { t } = useI18n();
  const stats = useStats(tasks);
  const hydrated = useHydrated();

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
      <StatTile label={t("A fazer")} value={stats.open} dot="bg-status-todo" />
      <StatTile label={t("Em andamento")} value={stats.inProgress} dot="bg-status-progress" />
      <StatTile label={t("Aguardando")} value={stats.waiting} dot="bg-status-waiting" />
      <StatTile label={t("Concluídas · 7 dias")} value={hydrated ? stats.thisWeek : 0} dot="bg-status-done">
        <div className={cn("flex items-end gap-2", !hydrated && "invisible")}>
          {stats.delta !== 0 ? (
            <span
              className="hidden rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium whitespace-nowrap text-muted-foreground tabular-nums sm:inline"
              title={t(stats.delta > 0 ? "{count} a mais que nos 7 dias anteriores" : "{count} a menos que nos 7 dias anteriores", { count: Math.abs(stats.delta) })}
            >
              {stats.delta > 0 ? "▲" : "▼"} {Math.abs(stats.delta)}
            </span>
          ) : null}
          <CompletionSparkline days={stats.days} />
        </div>
      </StatTile>
    </div>
  );
}
