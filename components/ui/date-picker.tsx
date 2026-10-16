"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useI18n } from "@/components/i18n-provider";

function useCalendarFormat() {
  const { locale } = useI18n();
  return useMemo(() => {
    const monthFormatter = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" });
    const weekdayFormatter = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" });
    return {
      weekdays: Array.from({ length: 7 }, (_, index) => weekdayFormatter.format(new Date(Date.UTC(2026, 0, 4 + index))).replace(".", "")),
      displayFormatter: new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }),
      formatMonthYear: (date: Date) => monthFormatter.format(date),
    };
  }, [locale]);
}
const CALENDAR_PANEL_WIDTH = 352;
const CALENDAR_PANEL_HEIGHT = 360;
const RANGE_PANEL_WIDTH = 288;
const RANGE_PANEL_HEIGHT = 350;
const CALENDAR_VIEWPORT_GAP = 12;

type CalendarPlacement = {
  top: number;
  left: number;
  vertical: "top" | "bottom";
  horizontal: "start" | "end";
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDate(value: string | null | undefined) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
}

function toIsoDate(date: Date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

function isSameDate(left: Date | null, right: Date) {
  return Boolean(left) && left?.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Selecionar data",
  disabled = false,
}: {
  value?: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  const { weekdays, displayFormatter, formatMonthYear } = useCalendarFormat();
  const selectedDate = parseDate(value);
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<CalendarPlacement>({
    top: CALENDAR_VIEWPORT_GAP,
    left: CALENDAR_VIEWPORT_GAP,
    vertical: "bottom",
    horizontal: "start",
  });
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const initialDate = selectedDate ?? new Date();
    return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
  });
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !popoverRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const firstWeekday = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1).getDay();
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const calendarDays = Array.from({ length: firstWeekday + daysInMonth }, (_, index) =>
    index < firstWeekday
      ? null
      : new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), index - firstWeekday + 1),
  );
  const today = startOfDay(new Date());
  const moveMonth = (offset: number) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  const selectDate = (date: Date) => {
    onChange(toIsoDate(date));
    setOpen(false);
  };

  const updatePlacement = () => {
    const bounds = rootRef.current?.getBoundingClientRect();
    if (!bounds) return;

    const panelWidth = Math.min(CALENDAR_PANEL_WIDTH, window.innerWidth - CALENDAR_VIEWPORT_GAP * 2);
    const panelHeight = popoverRef.current?.offsetHeight ?? CALENDAR_PANEL_HEIGHT;
    const spaceBelow = window.innerHeight - bounds.bottom;
    const spaceAbove = bounds.top;
    const shouldOpenAbove = spaceBelow < CALENDAR_PANEL_HEIGHT && spaceAbove > spaceBelow;
    const shouldAlignEnd = bounds.left + panelWidth > window.innerWidth - CALENDAR_VIEWPORT_GAP && bounds.right - panelWidth > CALENDAR_VIEWPORT_GAP;
    const preferredTop = shouldOpenAbove
      ? bounds.top - panelHeight - 8
      : bounds.bottom + 8;
    const preferredLeft = shouldAlignEnd
      ? bounds.right - panelWidth
      : bounds.left;

    setPlacement({
      top: Math.max(
        CALENDAR_VIEWPORT_GAP,
        Math.min(preferredTop, window.innerHeight - panelHeight - CALENDAR_VIEWPORT_GAP),
      ),
      left: Math.max(
        CALENDAR_VIEWPORT_GAP,
        Math.min(preferredLeft, window.innerWidth - panelWidth - CALENDAR_VIEWPORT_GAP),
      ),
      vertical: shouldOpenAbove ? "top" : "bottom",
      horizontal: shouldAlignEnd ? "end" : "start",
    });
  };

  useEffect(() => {
    if (!open) return;

    const frame = window.requestAnimationFrame(updatePlacement);
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [open, visibleMonth]);

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          updatePlacement();
          if (selectedDate) {
            setVisibleMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
          }
          setOpen((current) => !current);
        }}
        className="flex h-9 w-full min-w-0 items-center gap-2 rounded-lg border border-input bg-card px-3 text-left text-sm shadow-none transition hover:border-ring focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
      >
        <CalendarDays className="size-4 shrink-0 text-primary" />
        <span className={selectedDate ? "truncate" : "truncate text-muted-foreground"}>
          {selectedDate ? displayFormatter.format(selectedDate) : t(placeholder)}
        </span>
        <ChevronDown className={["ml-auto size-4 shrink-0 text-muted-foreground transition-transform", open ? "rotate-180" : ""].join(" ")} />
      </button>

      {open && typeof document !== "undefined" ? createPortal(
        <div
          ref={popoverRef}
          role="dialog"
          aria-label={t(placeholder)}
          className="fixed z-[9999] w-[min(22rem,calc(100vw-2rem))] rounded-xl border bg-popover p-3 text-popover-foreground shadow-lifted"
          style={{ top: placement.top, left: placement.left }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">{t("Calendário")}</p>
              <p className="mt-0.5 text-sm font-semibold capitalize">{formatMonthYear(visibleMonth)}</p>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => moveMonth(-1)} className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-foreground" aria-label={t("Mês anterior")}>
                <ChevronLeft className="size-4" />
              </button>
              <button type="button" onClick={() => moveMonth(1)} className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-foreground" aria-label={t("Próximo mês")}>
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted-foreground">
            {weekdays.map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {calendarDays.map((date, index) => date ? (
              <button
                key={toIsoDate(date)}
                type="button"
                onClick={() => selectDate(date)}
                aria-label={displayFormatter.format(date)}
                aria-pressed={isSameDate(selectedDate, date)}
                className={[
                  "relative flex aspect-square items-center justify-center rounded-lg text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isSameDate(selectedDate, date)
                    ? "bg-primary font-semibold text-primary-foreground"
                    : "hover:bg-brand-soft hover:text-primary",
                  isSameDate(null, date) && date.getTime() === today.getTime() ? "ring-1 ring-inset ring-ring" : "",
                ].join(" ")}
              >
                {date.getDate()}
              </button>
            ) : <span key={`empty-${index}`} aria-hidden="true" />)}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <button type="button" onClick={() => { onChange(null); setOpen(false); }} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive" disabled={!value}>
              <X className="size-3.5" />{t("Limpar")}</button>
            <button type="button" onClick={() => { const current = startOfDay(new Date()); setVisibleMonth(new Date(current.getFullYear(), current.getMonth(), 1)); selectDate(current); }} className="rounded-lg bg-brand-soft px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/15">{t("Hoje")}</button>
          </div>
        </div>,
        document.body,
      ) : null}
    </div>
  );
}

export function DateRangePicker({
  from,
  to,
  onChange,
  placeholder = "Selecionar período",
  compact = false,
}: {
  from?: string | null;
  to?: string | null;
  onChange: (from: string, to: string) => void;
  placeholder?: string;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const { weekdays, displayFormatter, formatMonthYear } = useCalendarFormat();
  const fromDate = parseDate(from);
  const toDate = parseDate(to);
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const initialDate = fromDate ?? new Date();
    return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
  });
  const [placement, setPlacement] = useState<CalendarPlacement>({
    top: CALENDAR_VIEWPORT_GAP,
    left: CALENDAR_VIEWPORT_GAP,
    vertical: "bottom",
    horizontal: "start",
  });
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !popoverRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const updatePlacement = () => {
    const bounds = rootRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const panelWidth = Math.min(RANGE_PANEL_WIDTH, window.innerWidth - CALENDAR_VIEWPORT_GAP * 2);
    const panelHeight = popoverRef.current?.offsetHeight ?? RANGE_PANEL_HEIGHT;
    const spaceBelow = window.innerHeight - bounds.bottom;
    const spaceAbove = bounds.top;
    const shouldOpenAbove = spaceBelow < RANGE_PANEL_HEIGHT && spaceAbove > spaceBelow;
    const shouldAlignEnd = bounds.left + panelWidth > window.innerWidth - CALENDAR_VIEWPORT_GAP && bounds.right - panelWidth > CALENDAR_VIEWPORT_GAP;
    const preferredTop = shouldOpenAbove ? bounds.top - panelHeight - 8 : bounds.bottom + 8;
    const preferredLeft = shouldAlignEnd ? bounds.right - panelWidth : bounds.left;
    setPlacement({
      top: Math.max(CALENDAR_VIEWPORT_GAP, Math.min(preferredTop, window.innerHeight - panelHeight - CALENDAR_VIEWPORT_GAP)),
      left: Math.max(CALENDAR_VIEWPORT_GAP, Math.min(preferredLeft, window.innerWidth - panelWidth - CALENDAR_VIEWPORT_GAP)),
      vertical: shouldOpenAbove ? "top" : "bottom",
      horizontal: shouldAlignEnd ? "end" : "start",
    });
  };

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(updatePlacement);
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [open, visibleMonth]);

  const firstWeekday = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1).getDay();
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const calendarDays = Array.from({ length: firstWeekday + daysInMonth }, (_, index) =>
    index < firstWeekday
      ? null
      : new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), index - firstWeekday + 1),
  );
  const today = startOfDay(new Date());
  const moveMonth = (offset: number) => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  const selectDate = (date: Date) => {
    const nextValue = toIsoDate(date);
    if (!fromDate || (fromDate && toDate) || date < fromDate) {
      onChange(nextValue, "");
      return;
    }
    onChange(from ?? nextValue, nextValue);
    setOpen(false);
  };
  const dateLabel = fromDate && toDate
    ? `${displayFormatter.format(fromDate)} – ${displayFormatter.format(toDate)}`
    : fromDate
      ? t("{date} – selecionar fim", { date: displayFormatter.format(fromDate) })
      : t(placeholder);

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          updatePlacement();
          if (fromDate) setVisibleMonth(new Date(fromDate.getFullYear(), fromDate.getMonth(), 1));
          setOpen((current) => !current);
        }}
        className={[
          "flex h-9 w-full min-w-0 items-center gap-2 rounded-lg border border-input bg-card px-3 text-left text-sm shadow-none transition hover:border-ring focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          compact ? "h-8 text-[0.8125rem]" : "",
        ].join(" ")}
      >
        <CalendarDays className="size-4 shrink-0 text-primary" />
        <span className={fromDate ? "truncate" : "truncate text-muted-foreground"}>{dateLabel}</span>
        <ChevronDown className={["ml-auto size-4 shrink-0 text-muted-foreground transition-transform", open ? "rotate-180" : ""].join(" ")} />
      </button>

      {open && typeof document !== "undefined" ? createPortal(
        <div
          ref={popoverRef}
          role="dialog"
          aria-label={t(placeholder)}
          className="fixed z-[9999] max-h-[calc(100dvh-1rem)] w-[min(18rem,calc(100vw-1rem))] overflow-y-auto rounded-xl border bg-popover p-2 text-popover-foreground shadow-lifted"
          style={{ top: placement.top, left: placement.left }}
        >
          <div className="flex items-center justify-between gap-1.5 border-b border-border pb-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">{t("Período")}</p>
              <p className="mt-0.5 text-xs font-semibold capitalize">{formatMonthYear(visibleMonth)}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{fromDate && !toDate ? t("Agora selecione o fim") : t("Selecione o início")}</p>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => moveMonth(-1)} className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-foreground" aria-label={t("Mês anterior")}><ChevronLeft className="size-4" /></button>
              <button type="button" onClick={() => moveMonth(1)} className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-foreground" aria-label={t("Próximo mês")}><ChevronRight className="size-4" /></button>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold text-muted-foreground">{weekdays.map((day) => <span key={day}>{day}</span>)}</div>
          <div className="mt-1 grid grid-cols-7 gap-0.5">
            {calendarDays.map((date, index) => {
              if (!date) return <span key={`empty-${index}`} aria-hidden="true" />;
              const isStart = isSameDate(fromDate, date);
              const isEnd = isSameDate(toDate, date);
              const isBetween = Boolean(fromDate && toDate && date > fromDate && date < toDate);
              const isToday = date.getTime() === today.getTime();
              return (
                <button
                  key={toIsoDate(date)}
                  type="button"
                  onClick={() => selectDate(date)}
                  aria-label={displayFormatter.format(date)}
                  className={["relative flex aspect-square items-center justify-center rounded-md text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", isStart || isEnd ? "bg-primary font-semibold text-primary-foreground" : isBetween ? "bg-primary/15 text-primary" : "hover:bg-brand-soft hover:text-primary", isToday && !isStart && !isEnd ? "ring-1 ring-inset ring-ring" : ""].join(" ")}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
            <button type="button" onClick={() => { onChange("", ""); setOpen(false); }} disabled={!from && !to} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"><X className="size-3.5" />{t("Limpar")}</button>
            <button type="button" onClick={() => { const current = startOfDay(new Date()); const value = toIsoDate(current); onChange(value, value); setVisibleMonth(new Date(current.getFullYear(), current.getMonth(), 1)); setOpen(false); }} className="rounded-lg bg-brand-soft px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/15">{t("Hoje")}</button>
          </div>
        </div>,
        document.body,
      ) : null}
    </div>
  );
}
