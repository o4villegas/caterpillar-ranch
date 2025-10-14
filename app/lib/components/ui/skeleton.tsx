import * as React from "react"

import { cn } from "../../utils"

/**
 * Skeleton - Horror-themed loading placeholder component
 *
 * Features:
 * - Pulsing animation (opacity changes) for horror aesthetic
 * - Semi-transparent purple base color
 * - Respects prefers-reduced-motion
 * - Supports custom className for shape overrides
 *
 * Usage:
 * <Skeleton className="h-12 w-12 rounded-full" />
 * <Skeleton className="h-4 w-[250px]" />
 */
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "animate-pulse rounded-lg bg-ranch-purple/30",
          className
        )}
        {...props}
      />
    )
  }
)
Skeleton.displayName = "Skeleton"

export { Skeleton }
