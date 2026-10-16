"use client";

import { useId } from "react";
import { Languages } from "lucide-react";

import { useI18n } from "@/components/i18n-provider";
import { isLocale, LOCALES, LOCALE_NAMES } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();
  const id = useId();

  return (
    <div className="flex min-w-0 items-center gap-2 text-sm">
      <label htmlFor={id} className={cn("flex items-center gap-2", compact && "sr-only")}>
        <Languages className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        {t("Idioma")}
      </label>
      <select
        id={id}
        value={locale}
        onChange={(event) => { if (isLocale(event.target.value)) setLocale(event.target.value); }}
        className="h-9 min-w-0 rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {LOCALES.map((value) => <option key={value} value={value} lang={value}>{LOCALE_NAMES[value]}</option>)}
      </select>
    </div>
  );
}
