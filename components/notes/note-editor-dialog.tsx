"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { Copy, LoaderCircle, Paperclip, Pencil, Pin, Trash2, X } from "lucide-react";

import {
  AttachmentGrid,
  AttachmentViewer,
  FileDropZone,
  sortAttachments,
} from "@/components/attachments";
import { RichText, toPlainText } from "@/components/rich-text";
import { SmartTextarea } from "@/components/smart-textarea";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { useToast } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";
import {
  useWorkspace,
  useWorkspaceActions,
  useWorkspaceUI,
} from "@/components/workspace/workspace-provider";
import { errorMessage } from "@/lib/api-client";

import { cn } from "@/lib/utils";
import type { Note, NoteAttachment } from "@/types/note";
import { useI18n } from "@/components/i18n-provider";
import { useFormat } from "@/lib/use-format";

const noteAttachmentUrl = (attachment: NoteAttachment) =>
  `/api/notes/${attachment.note_id}/attachments/${attachment.id}`;

function NoteViewer({
  note,
  onEdit,
  bodyRef,
}: {
  note: Note;
  onEdit: () => void;
  bodyRef: RefObject<HTMLDivElement | null>;
}) {
  const { formatDateTime } = useFormat();
  const { t } = useI18n();
  const actions = useWorkspaceActions();
  const { setNoteEditor } = useWorkspaceUI();
  const toast = useToast();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const attachments = sortAttachments(note.attachments);
  const updated = note.updated_at !== note.created_at;

  return (
    <>
      <div className="flex shrink-0 flex-col gap-3 border-b px-5 py-4 pr-14 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <DialogTitle className="text-lg break-words">{note.title}</DialogTitle>
          <DialogDescription className="mt-1 text-xs">{t("Criada em")}{" "}{formatDateTime(note.created_at)}
            {updated ? ` ${t("· editada em {date}", { date: formatDateTime(note.updated_at) })}` : ""}
          </DialogDescription>
        </div>
        <div className="-ml-2 flex shrink-0 items-center gap-0.5 sm:ml-0">
          <Tooltip content={note.is_pinned ? t("Desafixar") : "Fixar"}>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => void actions.togglePin(note.id)}
              aria-label={note.is_pinned ? t("Desafixar") : t("Fixar")}
              className={cn(note.is_pinned && "text-primary")}
            >
              <Pin className={cn(note.is_pinned && "fill-current")} />
            </Button>
          </Tooltip>
          <Tooltip content={t("Copiar conteúdo")}>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("Copiar conteúdo")}
              onClick={() =>
                void navigator.clipboard
                  .writeText(toPlainText(note.content))
                  .then(() => toast.success(t("Conteúdo copiado")))
              }
            >
              <Copy />
            </Button>
          </Tooltip>
          <Tooltip content={t("Excluir")}>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("Excluir")}
              className="hover:text-destructive"
              onClick={() => {
                setNoteEditor(null);
                void actions.deleteNote(note.id);
              }}
            >
              <Trash2 />
            </Button>
          </Tooltip>
          <Button variant="outline" size="sm" className="ml-1" onClick={onEdit}>
            <Pencil />{t("Editar")}</Button>
        </div>
      </div>
      <div ref={bodyRef} tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto px-5 py-5 outline-none">
        <RichText content={note.content} className="text-[0.9375rem]" />
        {attachments.length ? (
          <div className="mt-6">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">{t("Anexos")}</p>
            <AttachmentGrid attachments={attachments} urlFor={noteAttachmentUrl} onOpen={setViewerIndex} />
          </div>
        ) : null}
      </div>
      <AttachmentViewer
        attachments={attachments}
        index={viewerIndex}
        urlFor={noteAttachmentUrl}
        onIndexChange={setViewerIndex}
        onClose={() => setViewerIndex(null)}
      />
    </>
  );
}

function NoteForm({
  note,
  onDone,
  onDirtyChange,
}: {
  note: Note | null;
  onDone: (saved?: Note) => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const { t } = useI18n();
  const actions = useWorkspaceActions();
  const toast = useToast();
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const existing = sortAttachments(note?.attachments ?? []).filter((item) => !removedIds.includes(item.id));
  const dirty =
    title !== (note?.title ?? "") ||
    content !== (note?.content ?? "") ||
    files.length > 0 ||
    removedIds.length > 0;
  const valid = Boolean(title.trim() && content.trim());

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      const input = { title: title.trim(), content: content.trim() };
      const saved = note
        ? await actions.updateNote(note.id, input, files, removedIds)
        : await actions.createNote(input, files);
      toast.success(note ? t("Anotação salva") : t("Anotação criada"));
      onDone(saved);
    } catch (error) {
      toast.error(errorMessage(error, t("Não foi possível salvar a anotação.")));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      onPaste={(event) => {
        const pasted = Array.from(event.clipboardData.files);
        if (event.defaultPrevented || !pasted.length) return;
        event.preventDefault();
        setFiles((current) => [...current, ...pasted]);
      }}
    >
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 pt-5 pb-4">
        <DialogTitle className="sr-only">{note ? t("Editar anotação") : t("Nova anotação")}</DialogTitle>
        <DialogDescription className="sr-only">{t("Título e conteúdo da anotação.")}</DialogDescription>
        <input
          autoFocus={!note}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={t("Título")}
          aria-label={t("Título")}
          maxLength={160}
          disabled={saving}
          className="w-full pr-8 bg-transparent text-xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/60"
        />
        <SmartTextarea
          autoFocus={Boolean(note)}
          value={content}
          onValueChange={setContent}
          onSubmit={() => void save()}
          onPasteFiles={(pasted) => setFiles((current) => [...current, ...pasted])}
          disabled={saving}
          placeholder={t("Escreva livremente… use #tags, cole links ou digite /code e /json para blocos de código.")}
          className="min-h-56 border-transparent bg-transparent px-0 shadow-none focus-visible:border-transparent focus-visible:ring-0"
        />
        {existing.length ? (
          <AttachmentGrid
            attachments={existing}
            urlFor={noteAttachmentUrl}
            onOpen={() => undefined}
            onDelete={(attachment) => setRemovedIds((current) => [...current, attachment.id])}
          />
        ) : null}
        <FileDropZone onFiles={(added) => setFiles((current) => [...current, ...added])} disabled={saving}>
          {files.length ? (
            <div className="flex flex-wrap gap-1.5">
              {files.map((file, index) => (
                <span
                  key={`${file.name}-${index}`}
                  className="inline-flex max-w-56 items-center gap-1.5 rounded-full border bg-card py-1 pr-1 pl-2.5 text-xs shadow-soft"
                >
                  <Paperclip className="size-3 shrink-0 text-muted-foreground" />
                  <span className="truncate">{file.name || "arquivo"}</span>
                  <button
                    type="button"
                    onClick={() => setFiles((current) => current.filter((_, item) => item !== index))}
                    className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
                    aria-label={t("Remover {name}", { name: file.name })}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}
        </FileDropZone>
      </div>
      <div className="flex items-center justify-end gap-2 border-t bg-subtle/60 px-5 py-3">
        <Button variant="ghost" size="sm" onClick={() => onDone()} disabled={saving}>{t("Cancelar")}</Button>
        <Button size="sm" onClick={() => void save()} disabled={!valid || !dirty || saving}>
          {saving ? <LoaderCircle className="animate-spin" /> : null}
          {note ? t("Salvar") : t("Criar anotação")}
          <Kbd className="hidden border-primary-foreground/30 sm:inline-flex">Ctrl ↵</Kbd>
        </Button>
      </div>
    </div>
  );
}

export function NoteEditorDialog() {
  const { t } = useI18n();
  const { notes } = useWorkspace();
  const { noteEditor, setNoteEditor } = useWorkspaceUI();
  const [dirty, setDirty] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const viewerBodyRef = useRef<HTMLDivElement>(null);
  const note = noteEditor && noteEditor.mode !== "create"
    ? (notes.find((item) => item.id === noteEditor.noteId) ?? null)
    : null;
  const open = noteEditor !== null && (noteEditor.mode === "create" || note !== null);
  const [lastState, setLastState] = useState(noteEditor);
  if (noteEditor && noteEditor !== lastState) setLastState(noteEditor);
  const state = noteEditor ?? lastState;
  const shownNote = state && state.mode !== "create" ? notes.find((item) => item.id === state.noteId) ?? null : null;

  const close = () => {
    setDirty(false);
    setNoteEditor(null);
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (next) return;
          if (dirty) setConfirmClose(true);
          else close();
        }}
      >
        <DialogContent
          initialFocus={state?.mode === "view" ? viewerBodyRef : true}
          className="flex max-h-[min(88dvh,56rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 max-sm:top-auto max-sm:bottom-0 max-sm:max-h-[94dvh] max-sm:w-full max-sm:translate-y-0 max-sm:rounded-b-none">
          {state?.mode === "view" && shownNote ? (
            <NoteViewer
              note={shownNote}
              onEdit={() => setNoteEditor({ mode: "edit", noteId: shownNote.id })}
              bodyRef={viewerBodyRef}
            />
          ) : state ? (
            <NoteForm
              key={state.mode === "create" ? "create" : `edit-${state.noteId}`}
              note={state.mode === "edit" ? shownNote : null}
              onDirtyChange={setDirty}
              onDone={(saved) => {
                setDirty(false);
                if (state.mode === "edit" && shownNote) {
                  setNoteEditor({ mode: "view", noteId: shownNote.id });
                } else if (saved) {
                  setNoteEditor({ mode: "view", noteId: saved.id });
                } else {
                  setNoteEditor(null);
                }
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        title={t("Descartar alterações?")}
        description={t("O que você escreveu nesta anotação ainda não foi salvo.")}
        confirmLabel={t("Descartar")}
        cancelLabel={t("Continuar editando")}
        onConfirm={close}
      />
    </>
  );
}
