"use client";

import type { Announcements } from "@dnd-kit/core";
import { useI18n } from "@/components/i18n-provider";

/** Shared copy for flat sortable lists (subtasks and pinned notes). */
export function useSortableAccessibility(items: ReadonlyArray<{ id: string; title: string }>) {
  const { t } = useI18n();
  const title = (id: string | number) => items.find((item) => item.id === String(id))?.title ?? "—";
  const announcements: Announcements = {
    onDragStart: ({ active }) => t("Selecionado: {title}.", { title: title(active.id) }),
    onDragOver: ({ active, over }) => over ? t("{title} na posição {position}.", {
      title: title(active.id), position: items.findIndex((item) => item.id === String(over.id)) + 1,
    }) : undefined,
    onDragEnd: ({ active }) => t("{title} solta.", { title: title(active.id) }),
    onDragCancel: ({ active }) => t("Movimento cancelado. {title} voltou ao lugar.", { title: title(active.id) }),
  };
  return {
    screenReaderInstructions: {
      draggable: t("Para reordenar, pressione espaço. Use as setas para mudar de posição e espaço para soltar. Esc cancela."),
    },
    announcements,
  };
}
