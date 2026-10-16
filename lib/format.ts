import { DEFAULT_LOCALE, translate, type Locale } from "@/lib/i18n";

// Locale changes presentation; the fixed zone keeps hydration stable.
const timeZone = "America/Sao_Paulo";

export function formatDateTime(value: string | null, locale: Locale = DEFAULT_LOCALE) {
  return value ? new Intl.DateTimeFormat(locale, {
    dateStyle: "short", timeStyle: "short", timeZone,
  }).format(new Date(value)) : "-";
}

export function formatDate(value: string | null, locale: Locale = DEFAULT_LOCALE) {
  return value ? new Intl.DateTimeFormat(locale, {
    day: "2-digit", month: "2-digit", year: "numeric", timeZone,
  }).format(new Date(value)) : "-";
}

/** Formats a `YYYY-MM-DD` value without shifting it across timezones. */
export function formatPlainDate(value: string | null, locale: Locale = DEFAULT_LOCALE) {
  if (!value) return "-";
  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC",
  }).format(new Date(`${year}-${month}-${day}T12:00:00Z`));
}

export function formatShortDate(value: string, locale: Locale = DEFAULT_LOCALE) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric", month: "short", timeZone,
  }).format(new Date(value)).replace(".", "");
}

export function formatRelative(value: string, now = Date.now(), locale: Locale = DEFAULT_LOCALE) {
  const diffSeconds = Math.round((new Date(value).getTime() - now) / 1000);
  const abs = Math.abs(diffSeconds);
  const relativeFormatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (abs < 45) return translate(locale, "agora");
  if (abs < 3600) return relativeFormatter.format(Math.round(diffSeconds / 60), "minute");
  if (abs < 86_400) return relativeFormatter.format(Math.round(diffSeconds / 3600), "hour");
  if (abs < 86_400 * 7) return relativeFormatter.format(Math.round(diffSeconds / 86_400), "day");
  return formatShortDate(value, locale);
}

export function formatFileSize(size: number | null, locale: Locale = DEFAULT_LOCALE) {
  if (!size) return "—";
  if (size < 1024) return `${size} B`;
  const unit = size < 1024 * 1024 ? "KB" : "MB";
  const value = size / (unit === "KB" ? 1024 : 1024 * 1024);
  return `${new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value)} ${unit}`;
}

export function pluralize(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}
