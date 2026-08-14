import {
  createContext,
  useContext,
  useEffect,
  type HTMLAttributes,
  type PropsWithChildren
} from "react"

import { cn } from "../lib/utils"

const DialogContext = createContext<{
  open: boolean
  onOpenChange?: (open: boolean) => void
} | null>(null)
export function Dialog({
  open,
  onOpenChange,
  children
}: PropsWithChildren<{
  open?: boolean
  onOpenChange?: (open: boolean) => void
}>) {
  return (
    <DialogContext.Provider value={{ open: Boolean(open), onOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}
export function DialogContent({
  children,
  className,
  container: _container,
  ...props
}: PropsWithChildren<
  HTMLAttributes<HTMLDivElement> & { container?: HTMLElement | null }
>) {
  const context = useContext(DialogContext)
  useEffect(() => {
    if (!context?.open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") context.onOpenChange?.(false)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [context])

  if (!context?.open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) context.onOpenChange?.(false)
      }}>
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900 dark:text-gray-100",
          className
        )}
        onMouseDown={(event) => event.stopPropagation()}
        {...props}>
        {children}
      </div>
    </div>
  )
}
export function DialogHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-2", className)} {...props} />
}
export function DialogFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mt-4 flex justify-end gap-2", className)} {...props} />
  )
}
export function DialogTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold", className)} {...props} />
}
export function DialogDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-gray-600 dark:text-gray-300", className)}
      {...props}
    />
  )
}
