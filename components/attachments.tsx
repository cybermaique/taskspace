"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  File as FileIcon,
  FileAudio,
  FileCode2,
  FileText,
  ImageIcon,
  Trash2,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";
import { useFormat } from "@/lib/use-format";

export interface AttachmentLike {
  id: string;
  file_name: string;
  mime_type: string;
  file_size: number | null;
  created_at: string;
}

type Kind = "image" | "pdf" | "audio" | "text" | "file";

const TEXT_EXTENSIONS = ["txt", "md", "csv", "json", "log", "xml", "css", "js", "ts"];

export function getAttachmentKind(attachment: AttachmentLike): Kind {
  const mime = attachment.mime_type.toLowerCase();
  const extension = attachment.file_name.split(".").pop()?.toLowerCase() ?? "";
  if (mime.startsWith("image/") && !mime.includes("svg")) return "image";
  if (mime === "application/pdf" || extension === "pdf") return "pdf";
  if (mime.startsWith("audio/")) return "audio";
  if ((mime.startsWith("text/") && !mime.includes("html")) || mime === "application/json" || TEXT_EXTENSIONS.includes(extension)) {
    return "text";
  }
  return "file";
}

const KIND_ICONS = { image: ImageIcon, pdf: FileText, audio: FileAudio, text: FileCode2, file: FileIcon };

/** Images first, then by name, so galleries feel stable. */
export function sortAttachments<T extends AttachmentLike>(attachments: T[]) {
  return [...attachments].sort((left, right) => {
    const rank = (item: T) => (getAttachmentKind(item) === "image" ? 0 : 1);
    return (
      rank(left) - rank(right) ||
      left.file_name.localeCompare(right.file_name, "pt-BR", { numeric: true })
    );
  });
}

export function AttachmentGrid<T extends AttachmentLike>({
  attachments,
  urlFor,
  onOpen,
  onDelete,
}: {
  attachments: T[];
  urlFor: (attachment: T) => string;
  onOpen: (index: number) => void;
  onDelete?: (attachment: T) => void;
}) {
  const { formatFileSize } = useFormat();
  const { t } = useI18n();
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {attachments.map((attachment, index) => {
        const kind = getAttachmentKind(attachment);
        const Icon = KIND_ICONS[kind];
        return (
          <div
            key={attachment.id}
            className="group/attachment relative overflow-hidden rounded-lg border bg-card shadow-soft"
          >
            <button
              type="button"
              onClick={() => onOpen(index)}
              className="block w-full text-left outline-none focus-visible:ring-3 focus-visible:ring-ring"
              title={attachment.file_name}
            >
              <span className="grid aspect-[4/3] place-items-center overflow-hidden bg-muted">
                {kind === "image" ? (
                  // Authenticated API route: the Next image optimizer can't fetch it.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={urlFor(attachment)}
                    alt=""
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-300 group-hover/attachment:scale-[1.03]"
                  />
                ) : (
                  <Icon className="size-7 text-muted-foreground" />
                )}
              </span>
              <span className="block px-2 py-1.5">
                <span className="block truncate text-xs font-medium">{attachment.file_name}</span>
                <span className="block text-[0.68rem] text-muted-foreground">
                  {formatFileSize(attachment.file_size)}
                </span>
              </span>
            </button>
            <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 transition-opacity group-hover/attachment:opacity-100 focus-within:opacity-100 pointer-coarse:opacity-100">
              <a
                href={`${urlFor(attachment)}?download=1`}
                download={attachment.file_name}
                className="inline-flex size-7 items-center justify-center rounded-md bg-popover/90 text-muted-foreground shadow-soft backdrop-blur hover:text-foreground"
                aria-label={t("Baixar {name}", { name: attachment.file_name })}
              >
                <Download className="size-3.5" />
              </a>
              {onDelete ? (
                <button
                  type="button"
                  onClick={() => onDelete(attachment)}
                  className="inline-flex size-7 items-center justify-center rounded-md bg-popover/90 text-muted-foreground shadow-soft backdrop-blur hover:text-destructive"
                  aria-label={t("Remover {name}", { name: attachment.file_name })}
                >
                  <Trash2 className="size-3.5" />
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AttachmentViewer<T extends AttachmentLike>({
  attachments,
  index,
  urlFor,
  onIndexChange,
  onClose,
}: {
  attachments: T[];
  index: number | null;
  urlFor: (attachment: T) => string;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const { formatDate, formatFileSize } = useFormat();
  const { t } = useI18n();
  const attachment = index !== null ? attachments[index] : undefined;
  const count = attachments.length;

  useEffect(() => {
    if (index === null || count < 2) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") onIndexChange((index + 1) % count);
      if (event.key === "ArrowLeft") onIndexChange((index - 1 + count) % count);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [count, index, onIndexChange]);

  const kind = attachment ? getAttachmentKind(attachment) : "file";
  const url = attachment ? urlFor(attachment) : "";

  return (
    <Dialog open={Boolean(attachment)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex h-[min(90dvh,60rem)] max-w-[min(96vw,80rem)] flex-col gap-3 p-3 sm:p-4">
        <div className="flex min-w-0 items-center gap-3 pr-10">
          <div className="min-w-0">
            <DialogTitle className="truncate text-sm">{attachment?.file_name}</DialogTitle>
            <DialogDescription className="text-xs">
              {attachment ? `${formatFileSize(attachment.file_size)} · ${formatDate(attachment.created_at)}` : null}
              {count > 1 && index !== null ? ` · ${index + 1} de ${count}` : null}
            </DialogDescription>
          </div>
          {attachment ? (
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              nativeButton={false}
              render={<a href={`${url}?download=1`} download={attachment.file_name} />}
            >
              <Download />{t("Baixar")}</Button>
          ) : null}
        </div>
        <div className="relative grid min-h-0 flex-1 place-items-center overflow-hidden rounded-xl bg-muted">
          {attachment ? (
            kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt={attachment.file_name} className="max-h-full max-w-full object-contain" />
            ) : kind === "audio" ? (
              <audio controls src={url} className="w-full max-w-lg" />
            ) : kind === "pdf" || kind === "text" ? (
              <iframe src={url} title={attachment.file_name} className="size-full border-0 bg-white" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
                <FileIcon className="size-10" />{t("Prévia indisponível para este tipo de arquivo.")}</div>
            )
          ) : null}
          {count > 1 && index !== null ? (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full"
                onClick={() => onIndexChange((index - 1 + count) % count)}
                aria-label={t("Anterior")}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full"
                onClick={() => onIndexChange((index + 1) % count)}
                aria-label={t("Próximo")}
              >
                <ChevronRight />
              </Button>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Click-to-pick and drag-and-drop file target. */
export function FileDropZone({
  onFiles,
  disabled,
  children,
  className,
}: {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  const { t } = useI18n();
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        const files = Array.from(event.dataTransfer.files);
        if (files.length && !disabled) onFiles(files);
      }}
      className={className}
    >
      {children}
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-3 text-xs text-muted-foreground transition-colors hover:border-ring hover:text-foreground disabled:opacity-50",
          dragging && "border-primary bg-brand-soft text-primary",
        )}
      >
        <Upload className="size-3.5" />
        {dragging ? t("Solte para anexar") : t("Arraste arquivos, cole um print ou clique para escolher")}
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-label={t("Escolher arquivos")}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (files.length) onFiles(files);
        }}
      />
    </div>
  );
}
