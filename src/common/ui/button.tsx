import { forwardRef, type ButtonHTMLAttributes } from "react"

import { cn } from "../lib/utils"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost" | "outline" | "destructive"
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variant === "ghost" && "bg-transparent",
        variant === "outline" &&
          "border border-gray-300 bg-transparent dark:border-gray-700",
        variant === "destructive" && "bg-red-600 text-white",
        variant === "default" && "bg-gray-900 text-white",
        className
      )}
      {...props}
    />
  )
)
Button.displayName = "Button"
