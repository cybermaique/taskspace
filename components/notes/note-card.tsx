"use client";

import { forwardRef, memo, type HTMLAttributes } from "react";
import { Copy, Ellipsis, Paperclip, Pencil, Pin, PinOff, Trash2 } from "lucide-react";

import { extractHashtags, RichText, toPlainText } from "@/components/rich-text";
import { ContextMenu, ContextMenuTrigger, Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { useToast } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";
import { useWorkspaceActions, useWorkspaceUI } from "@/components/workspace/workspace-provider";
import { formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Note } from "@/types/note";

function NoteMenuContent({ note }: { note: Note }) {
  const actions = useWorkspaceActions();
  const { setNoteEditor } = useWorkspaceUI();
  const toast = useToast();

  return (
    <MenuContent className="w-48" align="end">
      <MenuItem onClick={() => setNoteEditor({ mode: "edit", noteId: note.id })}>
        <Pencil />
        Editar
      </MenuItem>
      <MenuItem onClick={() => void actions.togglePin(note.id)}>
        {note.is_pinned ? <PinOff /> : <Pin />}
        {note.is_pinned ? "Desafixar" : "Fixar no topo"}
      </MenuItem>
      <MenuItem
        onClick={() =>
          void navigator.clipboard
            .writeText(toPlainText(note.content))
            .then(() => toast.success("Conteúdo copiado"))
        }
      >
        <Copy />
        Copiar conteúdo
      </MenuItem>
      <MenuSeparator />
      <MenuItem destructive onClick={() => void actions.deleteNote(note.id)}>
        <Trash2 />
        Excluir
      </MenuItem>
    </MenuContent>
  );
}

interface NoteCardProps extends HTMLAttributes<HTMLDivElement> {
  note: Note;
  compact?: boolean;
  activeTag?: string | null;
  onTagClick?: (tag: string) => void;
  dragging?: boolean;
}

export const NoteCard = memo(
  forwardRef<HTMLDivElement, NoteCardProps>(function NoteCard(
    { note, compact = false, activeTag, onTagClick, dragging, className, ...props },
    ref,
  ) {
    const actions = useWorkspaceActions();
    const { setNoteEditor } = useWorkspaceUI();
    const tags = extractHashtags(note.content);
    const open = () => setNoteEditor({ mode: "view", noteId: note.id });

    const card = (
      <div
        ref={ref}
        role="button"
        tabIndex={0}
        aria-label={note.title}
        data-dragging={dragging}
        onClick={open}
        onKeyDown={(event) => {
          if (event.key === "Enter" && event.target === event.currentTarget) open();
        }}
        className={cn(
          "group/note relative mb-3 cursor-pointer break-inside-avoid rounded-xl border bg-card text-left shadow-soft transition-[box-shadow,border-color] outline-none hover:border-foreground/15 hover:shadow-lifted focus-visible:ring-3 focus-visible:ring-ring data-[dragging=true]:opacity-40",
          compact ? "p-3" : "p-4",
          className,
        )}
        {...props}
      >
        <div className="flex items-start gap-2">
          <h3 className="min-w-0 flex-1 text-[0.9375rem] leading-snug font-semibold break-words">
            {note.title}
          </h3>
          <div className="-mt-1 -mr-1.5 flex shrink-0 items-center opacity-0 transition-opacity group-hover/note:opacity-100 focus-within:opacity-100 has-[[data-popup-open]]:opacity-100 pointer-coarse:opacity-100">
            <Tooltip content={note.is_pinned ? "Desafixar" : "Fixar"}>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  void actions.togglePin(note.id);
                }}
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground",
                  note.is_pinned && "text-primary",
                )}
                aria-label={note.is_pinned ? "Desafixar anotação" : "Fixar anotação"}
              >
                <Pin className={cn("size-3.5", note.is_pinned && "fill-current")} />
              </button>
            </Tooltip>
            <Menu>
              <MenuTrigger
                onClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-foreground"
                aria-label={`Ações de ${note.title}`}
              >
                <Ellipsis className="size-4" />
              </MenuTrigger>
              <NoteMenuContent note={note} />
            </Menu>
          </div>
        </div>

        <div
          className={cn(
            "relative mt-2 overflow-hidden text-sm text-foreground/85",
            compact ? "max-h-28" : "max-h-64",
            "[mask-image:linear-gradient(to_bottom,black_75%,transparent)]",
          )}
        >
          <RichText content={note.content} collapsibleCode onTagClick={onTagClick} activeTag={activeTag} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
          <time dateTime={note.updated_at} suppressHydrationWarning>
            {formatShortDate(note.updated_at)}
          </time>
          {note.attachments.length ? (
            <span className="inline-flex items-center gap-1">
              <Paperclip className="size-3.5" />
              {note.attachments.length}
            </span>
          ) : null}
          {tags.slice(0, compact ? 2 : 4).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onTagClick?.(tag);
              }}
              className={cn(
                "rounded-md bg-muted px-1.5 py-0.5 font-medium transition-colors hover:bg-brand-soft hover:text-primary",
                activeTag === tag && "bg-brand-soft text-primary",
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    );

    return (
      <ContextMenu>
        <ContextMenuTrigger render={card} />
        <NoteMenuContent note={note} />
      </ContextMenu>
    );
  }),
);
