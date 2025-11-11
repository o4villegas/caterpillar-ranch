import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-lg font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ranch-lime focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-ranch-cyan text-ranch-dark hover:bg-ranch-lime shadow-lg hover:shadow-ranch-cyan/50",
        destructive:
          "bg-ranch-pink text-ranch-dark hover:bg-ranch-pink/90 shadow-lg heartbeat-pulse",
        outline:
          "border-2 border-ranch-lime text-ranch-lime hover:bg-ranch-lime/10 hover:border-ranch-cyan",
        secondary:
          "bg-ranch-purple/50 text-ranch-cream hover:bg-ranch-purple/70",
        ghost: "hover:bg-ranch-purple/20 text-ranch-cream",
        link: "text-ranch-cyan underline-offset-4 hover:underline",
        horror:
          "bg-gradient-to-r from-ranch-purple to-ranch-pink text-ranch-cream hover:scale-105 hover:shadow-2xl shadow-ranch-pink/50",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-9 px-4 text-xs",
        lg: "h-14 px-8 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
