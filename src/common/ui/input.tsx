import { forwardRef, type InputHTMLAttributes } from "react"

import { cn } from "../lib/utils"

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100",
      className
    )}
    {...props}
  />
))
Input.displayName = "Input"
