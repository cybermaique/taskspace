"use client"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { DialogCloseButton, DialogOverlay, DialogPortal } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

/** Side panel built on the dialog primitive; full screen on small viewports. */
function SheetContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & { showCloseButton?: boolean }) {
  return (
    <DialogPortal>
      <DialogOverlay className="bg-black/25 backdrop-blur-none dark:bg-black/50" />
      <DialogPrimitive.Popup
        data-slot="sheet-content"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex h-dvh w-full flex-col border-l bg-popover text-popover-foreground shadow-overlay outline-none sm:w-[min(44rem,calc(100vw-2rem))] sm:rounded-l-2xl",
          "transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-starting-style:translate-x-full data-ending-style:translate-x-full",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && <DialogCloseButton className="top-3.5 right-3.5" />}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

export { SheetContent }
