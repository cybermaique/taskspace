import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-150 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring active:not-aria-[haspopup]:scale-[0.98] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-soft hover:bg-primary/90",
        outline:
          "border-border bg-card shadow-soft hover:bg-accent hover:text-accent-foreground aria-expanded:bg-accent",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary",
        ghost:
          "text-muted-foreground hover:bg-accent hover:text-foreground aria-expanded:bg-accent aria-expanded:text-foreground",
        destructive:
          "bg-destructive text-white shadow-soft hover:bg-destructive/90 focus-visible:ring-destructive/30",
        "destructive-ghost":
          "text-destructive hover:bg-destructive/10 focus-visible:ring-destructive/30",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 gap-2 px-3.5",
        xs: "h-6 gap-1 rounded-md px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-2.5 text-[0.8125rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-2 px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-md [&_svg:not([class*='size-'])]:size-4",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      data-variant={variant}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
