"use client";

import { LOCALE_COOKIE, resolveLocale } from "@/lib/i18n";

export function getBrowserLocale() {
  const value = document.cookie.split(";").map((part) => part.trim())
    .find((part) => part.startsWith(`${LOCALE_COOKIE}=`))?.slice(LOCALE_COOKIE.length + 1);
  return resolveLocale(value);
}
