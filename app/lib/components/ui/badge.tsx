import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-ranch-lime focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-ranch-cyan text-ranch-dark shadow hover:bg-ranch-cyan/80",
        secondary:
          "border-transparent bg-ranch-purple/50 text-ranch-cream hover:bg-ranch-purple/70",
        destructive:
          "border-transparent bg-ranch-pink text-ranch-dark shadow heartbeat-pulse",
        outline: "border-ranch-lime text-ranch-lime hover:bg-ranch-lime/10",
        success:
          "border-transparent bg-ranch-lime text-ranch-dark shadow hover:bg-ranch-lime/80",
        ghost:
          "border-ranch-purple/30 text-ranch-cream hover:bg-ranch-purple/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
