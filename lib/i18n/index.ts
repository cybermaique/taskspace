import { messages, type MessageKey } from "./messages";

export const LOCALES = ["pt-BR", "en", "es"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "pt-BR";
export const LOCALE_COOKIE = "taskspace-locale";
export const LOCALE_NAMES: Record<Locale, string> = {
  "pt-BR": "Português",
  en: "English",
  es: "Español",
};

export function isLocale(value: unknown): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function resolveLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export type TranslationValues = Record<string, string | number>;
export type Translator = (message: string, values?: TranslationValues) => string;

/** Exact matches only: user titles, notes and categories are never translated. */
export function translate(locale: Locale, message: string, values: TranslationValues = {}) {
  const entry = Object.hasOwn(messages, message) ? messages[message as MessageKey] : undefined;
  const template = locale === "pt-BR" || !entry ? message : entry[locale === "en" ? 0 : 1];
  return template.replace(/\{(\w+)\}/g, (token, key: string) =>
    Object.hasOwn(values, key) ? String(values[key]) : token,
  );
}
