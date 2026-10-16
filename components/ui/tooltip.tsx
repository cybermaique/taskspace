"use client"

import type { ReactElement, ReactNode } from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

/** Wraps a single focusable element (passed as `children`) with a tooltip. */
function Tooltip({
  content,
  children,
  side = "top",
  className,
}: {
  content: ReactNode
  children: ReactElement
  side?: "top" | "bottom" | "left" | "right"
  className?: string
}) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger render={children} />
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Positioner side={side} sideOffset={6} className="isolate z-[70]">
          <TooltipPrimitive.Popup
            className={cn(
              "flex items-center gap-2 rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background shadow-lifted duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0",
              className
            )}
          >
            {content}
          </TooltipPrimitive.Popup>
        </TooltipPrimitive.Positioner>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}

export { Tooltip, TooltipProvider }
