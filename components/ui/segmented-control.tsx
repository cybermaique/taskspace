"use client";

import { cn } from "@/lib/utils";

export function SegmentedControl<Value extends string>({
  value,
  onChange,
  options,
  className,
  label,
}: {
  value: Value;
  onChange: (value: Value) => void;
  options: Array<{ value: Value; label: React.ReactNode; title?: string }>;
  className?: string;
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("inline-flex h-8 shrink-0 items-center rounded-lg bg-muted p-0.5", className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={option.title}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[0.8125rem] font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-card text-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
