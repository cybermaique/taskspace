"use client";

import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { formatPlainDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  DATE_MEETING_SOURCE_OPTIONS,
  getDateMeetingSourceLabel,
  type DateDetails,
  type DateDetailsInput,
} from "@/types/task";

const RATINGS = [
  ["personality_rating", "Personalidade"],
  ["face_rating", "Rosto"],
  ["body_rating", "Corpo"],
  ["sex_rating", "Sexo"],
] as const;

const TEXT_FIELDS = [
  ["work", "Trabalho"],
  ["sign", "Signo"],
  ["address", "Endereço"],
  ["height", "Altura"],
] as const;

function RatingInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null | undefined;
  onChange: (value: number | null) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className="tabular-nums">{value ?? "—"}</span>
      </div>
      <div className="flex gap-0.5" role="radiogroup" aria-label={`Nota ${label}`}>
        {Array.from({ length: 10 }, (_, index) => index + 1).map((rating) => (
          <button
            key={rating}
            type="button"
            role="radio"
            aria-checked={value === rating}
            aria-label={String(rating)}
            onClick={() => onChange(value === rating ? null : rating)}
            className={cn(
              "h-6 flex-1 rounded-[4px] transition-colors first:rounded-l-md last:rounded-r-md",
              value != null && rating <= value ? "bg-primary" : "bg-muted hover:bg-primary/30",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-medium text-muted-foreground">{children}</span>;
}

export function DateDetailsFields({
  value,
  onChange,
}: {
  value: DateDetailsInput;
  onChange: (value: DateDetailsInput) => void;
}) {
  const set = (patch: DateDetailsInput) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5">
          <FieldLabel>Conheceu por</FieldLabel>
          <Select
            value={value.met_via ?? "none"}
            onValueChange={(next) => set({ met_via: next === "none" ? null : String(next) })}
          >
            <SelectTrigger className="h-9 w-full bg-card">
              <span className={cn("truncate", !value.met_via && "text-muted-foreground")}>
                {getDateMeetingSourceLabel(value.met_via) ?? "Selecionar"}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Não informado</SelectItem>
              {DATE_MEETING_SOURCE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="space-y-1.5">
          <FieldLabel>Data do date</FieldLabel>
          <DatePicker
            value={value.date_at ?? null}
            onChange={(date_at) => set({ date_at })}
            placeholder="Selecionar data"
          />
        </label>
        <label className="space-y-1.5">
          <FieldLabel>Idade</FieldLabel>
          <Input
            type="number"
            inputMode="numeric"
            min={18}
            max={120}
            value={value.age ?? ""}
            onChange={(event) => set({ age: event.target.value ? Number(event.target.value) : null })}
            className="h-9 bg-card"
          />
        </label>
        <label className="space-y-1.5">
          <FieldLabel>Tem filhos</FieldLabel>
          <Select
            value={value.has_children == null ? "none" : String(value.has_children)}
            onValueChange={(next) => set({ has_children: next === "none" ? null : next === "true" })}
          >
            <SelectTrigger className="h-9 w-full bg-card">
              <span className={cn(value.has_children == null && "text-muted-foreground")}>
                {value.has_children == null ? "Não informado" : value.has_children ? "Sim" : "Não"}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Não informado</SelectItem>
              <SelectItem value="true">Sim</SelectItem>
              <SelectItem value="false">Não</SelectItem>
            </SelectContent>
          </Select>
        </label>
        {TEXT_FIELDS.map(([key, label]) => (
          <label key={key} className="space-y-1.5">
            <FieldLabel>{label}</FieldLabel>
            <Input
              value={value[key] ?? ""}
              onChange={(event) => set({ [key]: event.target.value || null })}
              className="h-9 bg-card"
            />
          </label>
        ))}
      </div>
      <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {RATINGS.map(([key, label]) => (
          <RatingInput
            key={key}
            label={label}
            value={value[key]}
            onChange={(rating) => set({ [key]: rating })}
          />
        ))}
      </div>
    </div>
  );
}

export function DateDetailsSummary({ details }: { details: DateDetails }) {
  const facts: Array<[string, string | number | null]> = [
    ["Conheceu por", getDateMeetingSourceLabel(details.met_via)],
    ["Data", details.date_at ? formatPlainDate(details.date_at) : null],
    ["Idade", details.age],
    ["Trabalho", details.work],
    ["Signo", details.sign],
    ["Altura", details.height],
    ["Endereço", details.address],
    ["Tem filhos", details.has_children == null ? null : details.has_children ? "Sim" : "Não"],
  ];
  const visible = facts.filter(([, value]) => value !== null && value !== "");
  const ratings = RATINGS.filter(([key]) => details[key] != null);

  if (!visible.length && !ratings.length) {
    return <p className="text-sm text-muted-foreground">Nenhum dado preenchido.</p>;
  }

  return (
    <div className="space-y-4">
      {visible.length ? (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {visible.map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="truncate font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {ratings.length ? (
        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
          {ratings.map(([key, label]) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium tabular-nums">{details[key]}/10</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${((details[key] ?? 0) / 10) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
