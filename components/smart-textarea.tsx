"use client";

import { forwardRef, useImperativeHandle, useRef, type TextareaHTMLAttributes } from "react";

import { expandSlashCodeCommand } from "@/lib/text-shortcuts";
import { cn } from "@/lib/utils";

interface SmartTextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value"> {
  value: string;
  onValueChange: (value: string) => void;
  /** Ctrl/⌘ + Enter. */
  onSubmit?: () => void;
  onCancel?: () => void;
  /** Files pasted from the clipboard (e.g. screenshots). */
  onPasteFiles?: (files: File[]) => void;
}

/** Auto-growing textarea with `/code` and `/json` block shortcuts. */
export const SmartTextarea = forwardRef<HTMLTextAreaElement, SmartTextareaProps>(
  function SmartTextarea(
    { value, onValueChange, onSubmit, onCancel, onPasteFiles, className, onKeyDown, ...props },
    forwardedRef,
  ) {
    const ref = useRef<HTMLTextAreaElement>(null);
    useImperativeHandle(forwardedRef, () => ref.current as HTMLTextAreaElement);

    return (
      <textarea
        ref={ref}
        data-slot="textarea"
        value={value}
        onChange={(event) => {
          const { value: next, selectionStart, selectionEnd } = event.target;
          const expansion = expandSlashCodeCommand(next, selectionStart, selectionEnd);
          if (!expansion) {
            onValueChange(next);
            return;
          }
          onValueChange(expansion.value);
          requestAnimationFrame(() => {
            ref.current?.setSelectionRange(expansion.caretPosition, expansion.caretPosition);
          });
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && onSubmit) {
            event.preventDefault();
            onSubmit();
          } else if (event.key === "Escape" && onCancel) {
            event.preventDefault();
            event.stopPropagation();
            onCancel();
          }
        }}
        onPaste={(event) => {
          const files = Array.from(event.clipboardData.files);
          if (files.length && onPasteFiles) {
            event.preventDefault();
            onPasteFiles(files);
          }
        }}
        className={cn(
          "field-sizing-content w-full resize-none rounded-lg border border-input bg-card px-3 py-2 text-base leading-relaxed outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-60 sm:text-sm",
          className,
        )}
        {...props}
      />
    );
  },
);
