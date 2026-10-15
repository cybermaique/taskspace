import { cn } from "@/lib/utils"

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "pointer-events-none inline-flex h-5 min-w-5 items-center justify-center rounded border border-current/20 bg-current/5 px-1 font-mono text-[0.68rem] font-medium opacity-80 select-none",
        className
      )}
      {...props}
    />
  )
}

export { Kbd }
