import * as React from "react"

import { cn } from "../../utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-lg border-2 border-ranch-purple bg-ranch-dark px-4 py-3 text-lg text-ranch-cream transition-all",
          "placeholder:text-ranch-lavender placeholder:opacity-60",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ranch-lime focus-visible:ring-offset-2 focus-visible:ring-offset-ranch-dark focus-visible:border-ranch-lime",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-ranch-dark/50",
          "hover:border-ranch-lavender",
          "file:border-0 file:bg-transparent file:text-base file:font-medium file:text-ranch-cream",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
