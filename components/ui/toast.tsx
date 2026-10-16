"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";

type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastOptions {
  action?: ToastAction;
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
  variant: ToastVariant;
  message: string;
}

type ToastFn = (message: string, options?: ToastOptions) => void;

interface ToastContextValue {
  success: ToastFn;
  error: ToastFn;
  warning: ToastFn;
  info: ToastFn;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const icons: Record<ToastVariant, ReactNode> = {
  success: <CheckCircle2 className="size-4 text-status-done" />,
  error: <XCircle className="size-4 text-destructive" />,
  warning: <AlertTriangle className="size-4 text-status-waiting" />,
  info: <Info className="size-4 text-status-progress" />,
};

const DEFAULT_DURATION_MS = 4000;
const EXIT_MS = 200;

function Toast({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  const { t } = useI18n();
  const [exiting, setExiting] = useState(false);
  const [paused, setPaused] = useState(false);
  const remainingRef = useRef(item.duration ?? (item.action ? 6500 : DEFAULT_DURATION_MS));

  const dismiss = useCallback(() => {
    setExiting(true);
    window.setTimeout(() => onDismiss(item.id), EXIT_MS);
  }, [item.id, onDismiss]);

  useEffect(() => {
    if (paused) return;
    const startedAt = Date.now();
    const timer = window.setTimeout(dismiss, remainingRef.current);
    return () => {
      window.clearTimeout(timer);
      remainingRef.current -= Date.now() - startedAt;
    };
  }, [dismiss, paused]);

  return (
    <div
      role={item.variant === "error" ? "alert" : "status"}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      className={cn(
        "pointer-events-auto flex w-full items-center gap-3 rounded-xl border bg-popover py-2.5 pr-2 pl-3.5 text-sm text-popover-foreground shadow-lifted transition-all duration-200 sm:w-auto sm:max-w-sm sm:min-w-72",
        exiting ? "translate-y-2 opacity-0" : "animate-rise",
      )}
    >
      <span className="shrink-0">{icons[item.variant]}</span>
      <p className="min-w-0 flex-1 font-medium [overflow-wrap:anywhere]">{t(item.message)}</p>
      {item.action ? (
        <button
          type="button"
          onClick={() => {
            item.action?.onClick();
            dismiss();
          }}
          className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-primary transition-colors hover:bg-brand-soft"
        >
          {t(item.action.label)}
        </button>
      ) : null}
      <button
        type="button"
        onClick={dismiss}
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label={t("Fechar notificação")}
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const ctx = useMemo<ToastContextValue>(() => {
    const add =
      (variant: ToastVariant): ToastFn =>
      (message, options) =>
        setToasts((current) => [
          ...current.slice(-3),
          { id: nextId++, variant, message, ...options },
        ]);
    return {
      success: add("success"),
      error: add("error"),
      warning: add("warning"),
      info: add("info"),
    };
  }, []);

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-3 bottom-[calc(4.5rem+var(--safe-bottom))] z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:items-end lg:bottom-5"
      >
        {toasts.map((item) => (
          <Toast key={item.id} item={item} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
