// A fixed zone keeps server-rendered and hydrated output identical.
const timeZone = "America/Sao_Paulo";

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone,
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone,
});

const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "short",
  timeZone,
});

const relativeFormatter = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

export function formatDateTime(value: string | null) {
  return value ? dateTimeFormatter.format(new Date(value)) : "-";
}

export function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : "-";
}

/** Formats a `YYYY-MM-DD` value without shifting it across timezones. */
export function formatPlainDate(value: string | null) {
  if (!value) return "-";
  const [year, month, day] = value.slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

export function formatShortDate(value: string) {
  return shortDateFormatter.format(new Date(value)).replace(".", "");
}

export function formatRelative(value: string, now = Date.now()) {
  const diffSeconds = Math.round((new Date(value).getTime() - now) / 1000);
  const abs = Math.abs(diffSeconds);
  if (abs < 45) return "agora";
  if (abs < 3600) return relativeFormatter.format(Math.round(diffSeconds / 60), "minute");
  if (abs < 86_400) return relativeFormatter.format(Math.round(diffSeconds / 3600), "hour");
  if (abs < 86_400 * 7) return relativeFormatter.format(Math.round(diffSeconds / 86_400), "day");
  return formatShortDate(value);
}

export function formatFileSize(size: number | null) {
  if (!size) return "—";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function pluralize(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}
