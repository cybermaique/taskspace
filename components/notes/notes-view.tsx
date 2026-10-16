"use client";

import { useDeferredValue, useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Hash, NotebookPen, Pin, Plus, Search, X } from "lucide-react";

import { NoteCard } from "@/components/notes/note-card";
import { extractHashtags } from "@/components/rich-text";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-picker";
import { PageHeader } from "@/components/workspace/app-shell";
import {
  useWorkspace,
  useWorkspaceActions,
  useWorkspaceUI,
} from "@/components/workspace/workspace-provider";
import { pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Note } from "@/types/note";
import { useI18n } from "@/components/i18n-provider";
import { useSortableAccessibility } from "@/lib/use-sortable-accessibility";

export const NOTE_SEARCH_INPUT_ID = "note-search";

function sortPinned(notes: Note[]) {
  return notes
    .filter((note) => note.is_pinned)
    .sort(
      (left, right) =>
        (left.pinned_position ?? Number.MAX_SAFE_INTEGER) -
          (right.pinned_position ?? Number.MAX_SAFE_INTEGER) ||
        new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime(),
    );
}

function matches(note: Note, query: string, tag: string | null, from: string, to: string) {
  if (tag && !extractHashtags(note.content).includes(tag)) return false;
  const created = new Date(note.created_at).getTime();
  if (from && created < new Date(`${from}T00:00:00`).getTime()) return false;
  if (to && created >= new Date(`${to}T00:00:00`).getTime() + 86_400_000) return false;
  if (!query) return true;
  const haystack = `${note.title} ${note.content}`.toLocaleLowerCase("pt-BR");
  return query
    .toLocaleLowerCase("pt-BR")
    .split(/\s+/)
    .every((word) => haystack.includes(word));
}

function SortablePinnedCard(props: {
  note: Note;
  compact: boolean;
  activeTag: string | null;
  onTagClick: (tag: string) => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: props.note.id });
  return (
    <NoteCard
      ref={setNodeRef}
      {...props}
      dragging={isDragging}
      className="mb-0 h-full"
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...listeners}
      openButtonRef={setActivatorNodeRef}
      openButtonProps={attributes}
    />
  );
}

function PinnedNotes({
  notes,
  activeTag,
  onTagClick,
}: {
  notes: Note[];
  activeTag: string | null;
  onTagClick: (tag: string) => void;
}) {
  const { t } = useI18n();
  const accessibility = useSortableAccessibility(notes);
  const actions = useWorkspaceActions();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space"] },
    }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const ids = notes.map((note) => note.id);
    void actions.reorderPinned(
      arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))),
    );
  };

  return (
    <section>
      <h2 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        <Pin className="size-3.5" />{t("Fixadas")}</h2>
      <DndContext id="pinned-notes" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} accessibility={accessibility}>
        <SortableContext items={notes.map((note) => note.id)} strategy={rectSortingStrategy}>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {notes.map((note) => (
              <SortablePinnedCard
                key={note.id}
                note={note}
                compact
                activeTag={activeTag}
                onTagClick={onTagClick}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}

export function NotesView() {
  const { t } = useI18n();
  const { notes, profile } = useWorkspace();
  const { setNoteEditor } = useWorkspaceUI();
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [range, setRange] = useState({ from: "", to: "" });
  const query = useDeferredValue(search.trim());
  const compact = profile.display_mode === "compact";
  const filtering = Boolean(query || activeTag || range.from || range.to);

  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const note of notes) {
      for (const tag of extractHashtags(note.content)) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return [...counts.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  }, [notes]);

  const filtered = useMemo(
    () => notes.filter((note) => matches(note, query, activeTag, range.from, range.to)),
    [activeTag, notes, query, range.from, range.to],
  );
  const pinned = useMemo(() => sortPinned(filtered), [filtered]);
  const others = useMemo(() => filtered.filter((note) => !note.is_pinned), [filtered]);
  const toggleTag = (tag: string) => setActiveTag((current) => (current === tag ? null : tag));

  return (
    <div className="mx-auto w-full max-w-[110rem]">
      <PageHeader
        title={t("Anotações")}
        description={t("{notes} no seu espaço. Use #tags para organizar.", { notes: pluralize(notes.length, t("anotação"), t("anotações")) })}
      />

      <div className="space-y-5 px-4 pt-5 sm:px-6 lg:px-8">
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-0 basis-full sm:max-w-sm sm:flex-1 sm:basis-auto">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id={NOTE_SEARCH_INPUT_ID}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setSearch("");
                    event.currentTarget.blur();
                  }
                }}
                placeholder={t("Buscar em títulos e conteúdo…")}
                aria-label={t("Buscar anotações")}
                className="h-8 w-full rounded-lg border border-input bg-card pr-3 pl-8 text-base shadow-soft outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 sm:text-[0.8125rem]"
              />
            </label>
            <div className="w-52 max-sm:flex-1">
              <DateRangePicker
                from={range.from || null}
                to={range.to || null}
                onChange={(from, to) => setRange({ from, to })}
                placeholder={t("Criadas em…")}
                compact
              />
            </div>
            {filtering ? (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => {
                  setSearch("");
                  setActiveTag(null);
                  setRange({ from: "", to: "" });
                }}
              >
                <X />{t("Limpar")}<span className="text-muted-foreground tabular-nums">· {filtered.length}</span>
              </Button>
            ) : null}
          </div>

          {allTags.length ? (
            <div className="scrollbar-none flex gap-1.5 overflow-x-auto pb-0.5">
              {allTags.map(([tag, count]) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  aria-pressed={activeTag === tag}
                  className={cn(
                    "inline-flex h-7 shrink-0 items-center gap-1 rounded-full border px-2.5 text-xs font-medium transition-colors",
                    activeTag === tag
                      ? "border-primary/40 bg-brand-soft text-primary"
                      : "bg-card text-muted-foreground shadow-soft hover:text-foreground",
                  )}
                >
                  <Hash className="size-3" />
                  {tag.replace(/^#/, "")}
                  <span className="font-normal tabular-nums">{count}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {notes.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed bg-card/50 px-6 py-16 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-primary">
              <NotebookPen className="size-6" />
            </span>
            <h2 className="mt-4 text-base font-semibold">{t("Nenhuma anotação ainda")}</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t("Guarde ideias, links e trechos de código. Fixe as mais importantes no topo.")}</p>
            <Button className="mt-5" onClick={() => setNoteEditor({ mode: "create" })}>
              <Plus />{t("Nova anotação")}</Button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed px-6 py-14 text-center text-sm text-muted-foreground">{t("Nenhuma anotação encontrada para esse filtro.")}</p>
        ) : (
          <>
            {pinned.length ? (
              <PinnedNotes notes={pinned} activeTag={activeTag} onTagClick={toggleTag} />
            ) : null}
            {others.length ? (
              <section>
                {pinned.length ? (
                  <h2 className="mb-2.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("Outras")}</h2>
                ) : null}
                <div className="columns-1 gap-3 pb-4 sm:columns-2 xl:columns-3 2xl:columns-4">
                  {others.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      compact={compact}
                      activeTag={activeTag}
                      onTagClick={toggleTag}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
