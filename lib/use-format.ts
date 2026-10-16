"use client";

import { useMemo } from "react";
import { useI18n } from "@/components/i18n-provider";
import * as format from "@/lib/format";

export function useFormat() {
  const { locale } = useI18n();
  return useMemo(() => ({
    formatDate: (value: string | null) => format.formatDate(value, locale),
    formatDateTime: (value: string | null) => format.formatDateTime(value, locale),
    formatPlainDate: (value: string | null) => format.formatPlainDate(value, locale),
    formatShortDate: (value: string) => format.formatShortDate(value, locale),
    formatRelative: (value: string) => format.formatRelative(value, Date.now(), locale),
    formatFileSize: (value: number | null) => format.formatFileSize(value, locale),
  }), [locale]);
}
