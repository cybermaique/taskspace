"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { FlaskConical, NotebookPen, Plus, Search, SquareKanban, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip } from "@/components/ui/tooltip";
import { UserMenu } from "@/components/workspace/user-menu";
import {
  useWorkspace,
  useWorkspaceUI,
  type WorkspaceView,
} from "@/components/workspace/workspace-provider";
import { cn } from "@/lib/utils";

const NAV_ITEMS: Array<{ view: WorkspaceView; label: string; icon: LucideIcon; shortcut: string }> = [
  { view: "tasks", label: "Tarefas", icon: SquareKanban, shortcut: "1" },
  { view: "notes", label: "Anotações", icon: NotebookPen, shortcut: "2" },
];

function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground shadow-soft",
        className,
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.4}>
        <rect x="3.5" y="4" width="5" height="16" rx="1.5" />
        <rect x="10.5" y="4" width="5" height="10" rx="1.5" />
        <rect x="17.5" y="4" width="3" height="6" rx="1.2" />
      </svg>
    </span>
  );
}

function useNavCounts() {
  const { tasks, notes } = useWorkspace();
  return {
    tasks: tasks.filter((task) => task.status !== "completed").length,
    notes: notes.length,
  };
}

function Sidebar() {
  const { view, setView, setPaletteOpen, openCreateTask, setNoteEditor } = useWorkspaceUI();
  const counts = useNavCounts();

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="flex h-14 items-center gap-2.5 px-4">
        <BrandMark />
        <span className="text-[0.95rem] font-semibold tracking-tight">Taskboard</span>
      </div>

      <div className="space-y-1 px-3">
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="flex h-9 w-full items-center gap-2 rounded-lg border bg-card px-2.5 text-sm text-muted-foreground shadow-soft transition-colors hover:text-foreground"
        >
          <Search className="size-4" />
          <span className="flex-1 text-left">Buscar…</span>
          <Kbd>Ctrl K</Kbd>
        </button>
      </div>

      <nav className="mt-4 space-y-0.5 px-3" aria-label="Seções">
        {NAV_ITEMS.map((item) => {
          const active = view === item.view;
          return (
            <button
              key={item.view}
              type="button"
              onClick={() => setView(item.view)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-card text-foreground shadow-soft ring-1 ring-border"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <item.icon className={cn("size-4", active && "text-primary")} />
              <span className="flex-1 text-left">{item.label}</span>
              <span className="text-xs tabular-nums text-muted-foreground">{counts[item.view]}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-4 px-3">
        <Button
          className="w-full justify-start"
          onClick={() => (view === "tasks" ? openCreateTask() : setNoteEditor({ mode: "create" }))}
        >
          <Plus />
          {view === "tasks" ? "Nova tarefa" : "Nova anotação"}
          <Kbd className="ml-auto border-primary-foreground/30">C</Kbd>
        </Button>
      </div>

      <div className="mt-auto border-t border-sidebar-border p-2">
        <UserMenu />
      </div>
    </aside>
  );
}

function MobileTopBar() {
  const { setPaletteOpen } = useWorkspaceUI();
  return (
    <header className="pt-safe sticky top-0 z-30 border-b bg-background/85 backdrop-blur-lg lg:hidden">
      <div className="flex h-14 items-center gap-2 px-4">
        <BrandMark />
        <span className="font-semibold tracking-tight">Taskboard</span>
        <div className="ml-auto flex items-center gap-1">
          <Tooltip content="Buscar">
            <Button variant="ghost" size="icon" aria-label="Buscar" onClick={() => setPaletteOpen(true)}>
              <Search />
            </Button>
          </Tooltip>
          <UserMenu compact />
        </div>
      </div>
    </header>
  );
}

function MobileNav() {
  const { view, setView, openCreateTask, setNoteEditor } = useWorkspaceUI();
  const counts = useNavCounts();

  return (
    <nav
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 backdrop-blur-lg lg:hidden"
      aria-label="Seções"
    >
      <div className="relative mx-auto grid h-16 max-w-md grid-cols-3 items-center px-4">
        {NAV_ITEMS.slice(0, 1).map((item) => (
          <MobileNavButton key={item.view} item={item} active={view === item.view} count={counts[item.view]} onClick={() => setView(item.view)} />
        ))}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => (view === "tasks" ? openCreateTask() : setNoteEditor({ mode: "create" }))}
            className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lifted transition-transform active:scale-95"
            aria-label={view === "tasks" ? "Nova tarefa" : "Nova anotação"}
          >
            <Plus className="size-5" />
          </button>
        </div>
        {NAV_ITEMS.slice(1).map((item) => (
          <MobileNavButton key={item.view} item={item} active={view === item.view} count={counts[item.view]} onClick={() => setView(item.view)} />
        ))}
      </div>
    </nav>
  );
}

function MobileNavButton({
  item,
  active,
  count,
  onClick,
}: {
  item: (typeof NAV_ITEMS)[number];
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-col items-center gap-1 text-[0.7rem] font-medium transition-colors",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <span className="relative">
        <item.icon className="size-5" />
        {count > 0 ? (
          <span className="absolute -top-1.5 -right-2.5 min-w-4 rounded-full bg-muted px-1 text-center text-[0.6rem] leading-4 text-muted-foreground tabular-nums">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </span>
      {item.label}
    </button>
  );
}

function DemoBanner() {
  const { mode } = useWorkspace();
  if (mode !== "demo") return null;

  return (
    <div className="flex items-center gap-2 border-b bg-brand-soft px-4 py-2 text-xs sm:px-6 lg:px-8">
      <FlaskConical className="size-3.5 shrink-0 text-primary" />
      <p className="min-w-0 flex-1">
        <span className="font-medium">Modo demonstração.</span>{" "}
        <span className="text-muted-foreground">Tudo funciona e fica salvo apenas neste navegador.</span>
      </p>
      <Link href="/login" className="shrink-0 font-medium text-primary hover:underline">
        Criar conta
      </Link>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="app-backdrop flex min-w-0 flex-1 flex-col">
        <MobileTopBar />
        <DemoBanner />
        <main className="min-w-0 flex-1 pb-[calc(5rem+var(--safe-bottom))] lg:pb-0">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 px-4 pt-5 sm:px-6 lg:px-8 lg:pt-8">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
