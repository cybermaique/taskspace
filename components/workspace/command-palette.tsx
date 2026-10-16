"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  CornerDownLeft,
  Keyboard,
  LogOut,
  NotebookPen,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  SquareKanban,
  StickyNote,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "next-themes";

import { previewText } from "@/components/rich-text";
import { taskMatchesQuery } from "@/components/tasks/use-task-filters";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { THEME_OPTIONS } from "@/components/workspace/theme-options";
import {
  useWorkspace,
  useWorkspaceActions,
  useWorkspaceUI,
} from "@/components/workspace/workspace-provider";
import { resetDemoState } from "@/lib/demo/demo-transport";
import { STATUS_META } from "@/lib/task-meta";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";

interface CommandItem {
  id: string;
  group: string;
  label: string;
  hint?: ReactNode;
  icon: LucideIcon;
  iconClass?: string;
  keywords?: string;
  run: () => void;
}

function normalize(value: string) {
  return value
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function PaletteBody({ onClose }: { onClose: () => void }) {
  const { t, locale } = useI18n();
  const { tasks, notes, mode } = useWorkspace();
  const { signOut } = useWorkspaceActions();
  const ui = useWorkspaceUI();
  const { setTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const items = useMemo<CommandItem[]>(() => {
    const run = (action: () => void) => () => {
      onClose();
      action();
    };
    const q = normalize(query.trim());

    const allCommands: CommandItem[] = [
      { id: "new-task", group: t("Ações"), label: t("Nova tarefa"), icon: Plus, hint: <Kbd>C</Kbd>, run: run(() => ui.openCreateTask()) },
      { id: "new-note", group: t("Ações"), label: t("Nova anotação"), icon: NotebookPen, run: run(() => ui.setNoteEditor({ mode: "create" })) },
      { id: "go-tasks", group: t("Ações"), label: t("Ir para Tarefas"), icon: SquareKanban, hint: <Kbd>1</Kbd>, run: run(() => ui.setView("tasks")) },
      { id: "go-notes", group: t("Ações"), label: t("Ir para Anotações"), icon: StickyNote, hint: <Kbd>2</Kbd>, run: run(() => ui.setView("notes")) },
      ...THEME_OPTIONS.map((option) => ({
        id: `theme-${option.value}`,
        group: t("Ações"),
        label: t("Tema: {theme}", { theme: t(option.label) }),
        keywords: "aparencia modo cor",
        icon: option.icon,
        run: run(() => setTheme(option.value)),
      })),
      { id: "trash", group: t("Ações"), label: t("Abrir lixeira"), icon: Trash2, run: run(() => ui.setTrashOpen(true)) },
      { id: "settings", group: t("Ações"), label: t("Preferências"), keywords: "perfil avatar cor apelido", icon: Settings2, run: run(() => ui.setSettingsOpen(true)) },
      { id: "shortcuts", group: t("Ações"), label: t("Atalhos de teclado"), icon: Keyboard, hint: <Kbd>?</Kbd>, run: run(() => ui.setShortcutsOpen(true)) },
      ...(mode === "demo"
        ? [
            {
              id: "demo-reset",
              group: t("Ações"),
              label: t("Restaurar dados da demonstração"),
              keywords: "reset demo exemplo",
              icon: RotateCcw,
              run: run(() => {
                resetDemoState();
                window.location.reload();
              }),
            },
          ]
        : []),
      { id: "logout", group: t("Ações"), label: t("Sair"), icon: LogOut, run: run(() => void signOut()) },
    ];
    const commands = allCommands.filter(
      (item) => !q || normalize(`${item.label} ${item.keywords ?? ""}`).includes(q),
    );

    const matchedTasks = (q ? tasks.filter((task) => taskMatchesQuery(task, query.trim())) : tasks.filter((task) => task.status !== "completed"))
      .slice(0, q ? 8 : 5)
      .map<CommandItem>((task) => {
        const meta = STATUS_META[task.status];
        return {
          id: `task-${task.id}`,
          group: t("Tarefas"),
          label: task.title,
          icon: meta.icon,
          iconClass: meta.tone,
          hint: <span className="text-xs text-muted-foreground">{t(meta.label)}</span>,
          run: run(() => {
            ui.setView("tasks");
            ui.openTask(task.id);
          }),
        };
      });

    const matchedNotes = notes
      .filter((note) => !q || normalize(`${note.title} ${note.content}`).includes(q))
      .slice(0, q ? 6 : 3)
      .map<CommandItem>((note) => ({
        id: `note-${note.id}`,
        group: t("Anotações"),
        label: note.title,
        icon: StickyNote,
        hint: <span className="max-w-48 truncate text-xs text-muted-foreground">{previewText(note.content, 60, locale)}</span>,
        run: run(() => {
          ui.setView("notes");
          ui.setNoteEditor({ mode: "view", noteId: note.id });
        }),
      }));

    return q ? [...matchedTasks, ...matchedNotes, ...commands] : [...commands.slice(0, 4), ...matchedTasks, ...matchedNotes, ...commands.slice(4)];
  }, [locale, mode, notes, onClose, query, setTheme, signOut, t, tasks, ui]);

  const safeIndex = Math.min(activeIndex, Math.max(0, items.length - 1));

  const move = (delta: number) => {
    if (!items.length) return;
    const next = (safeIndex + delta + items.length) % items.length;
    setActiveIndex(next);
    listRef.current?.querySelector(`[data-index="${next}"]`)?.scrollIntoView({ block: "nearest" });
  };

  let lastGroup = "";

  return (
    <>
      <DialogTitle className="sr-only">{t("Paleta de comandos")}</DialogTitle>
      <DialogDescription className="sr-only">{t("Busque tarefas, anotações e ações.")}</DialogDescription>
      <div className="flex items-center gap-2 border-b px-4">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          autoFocus
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              move(1);
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              move(-1);
            } else if (event.key === "Enter") {
              event.preventDefault();
              items[safeIndex]?.run();
            }
          }}
          placeholder={t("Buscar tarefas, anotações ou ações…")}
          aria-label={t("Buscar")}
          role="combobox"
          aria-expanded="true"
          aria-controls="command-list"
          aria-activedescendant={items[safeIndex] ? `command-${items[safeIndex].id}` : undefined}
          className="h-13 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground sm:text-sm"
        />
        <Kbd className="text-muted-foreground">Esc</Kbd>
      </div>
      <div ref={listRef} id="command-list" role="listbox" className="max-h-[min(60dvh,26rem)] overflow-y-auto p-1.5">
        {items.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">{t("Nada encontrado para “{query}”", { query })}.</p>
        ) : (
          items.map((item, index) => {
            const showGroup = item.group !== lastGroup;
            lastGroup = item.group;
            const active = index === safeIndex;
            return (
              <div key={item.id}>
                {showGroup ? (
                  <p className="px-2.5 pt-2.5 pb-1 text-[0.7rem] font-semibold tracking-wide text-muted-foreground uppercase">
                    {item.group}
                  </p>
                ) : null}
                <div
                  id={`command-${item.id}`}
                  role="option"
                  aria-selected={active}
                  data-index={index}
                  onClick={item.run}
                  onMouseMove={() => activeIndex !== index && setActiveIndex(index)}
                  className={cn(
                    "flex h-9 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-sm",
                    active && "bg-accent",
                  )}
                >
                  <item.icon className={cn("size-4 shrink-0 text-muted-foreground", item.iconClass)} />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.hint}
                  {active ? <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" /> : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

export function CommandPalette() {
  const { paletteOpen, setPaletteOpen } = useWorkspaceUI();

  return (
    <Dialog open={paletteOpen} onOpenChange={setPaletteOpen}>
      <DialogContent
        showCloseButton={false}
        className="top-[14dvh] max-w-xl translate-y-0 gap-0 overflow-hidden p-0"
      >
        {paletteOpen ? <PaletteBody onClose={() => setPaletteOpen(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}
