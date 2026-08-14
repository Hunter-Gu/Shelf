import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type MouseEvent,
  type PropsWithChildren,
  type ReactElement,
  type RefObject
} from "react"

import { cn } from "../lib/utils"

type PopoverValue = {
  open: boolean
  setOpen: (open: boolean) => void
  rootRef: RefObject<HTMLDivElement | null>
}
const PopoverContext = createContext<PopoverValue | null>(null)

export function Popover({
  open: controlledOpen,
  onOpenChange,
  children
}: PropsWithChildren<{
  open?: boolean
  onOpenChange?: (open: boolean) => void
}>) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = (next: boolean) => {
    setUncontrolledOpen(next)
    onOpenChange?.(next)
  }

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", handlePointerDown, true)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  return (
    <PopoverContext.Provider value={{ open, setOpen, rootRef }}>
      <div ref={rootRef} className="relative inline-block">
        {children}
      </div>
    </PopoverContext.Provider>
  )
}

export function PopoverTrigger({
  asChild,
  children,
  onClick,
  ...props
}: PropsWithChildren<{ asChild?: boolean } & HTMLAttributes<HTMLElement>>) {
  const context = useContext(PopoverContext)
  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{
      onClick?: (event: MouseEvent<HTMLElement>) => void
    }>
    return cloneElement(child, {
      ...props,
      onClick: (event) => {
        child.props.onClick?.(event)
        onClick?.(event)
        if (!event.defaultPrevented) context?.setOpen(!context.open)
      }
    })
  }
  return (
    <button
      type="button"
      {...props}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) context?.setOpen(!context.open)
      }}>
      {children}
    </button>
  )
}

export function PopoverContent({
  className,
  children,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  const context = useContext(PopoverContext)
  if (!context?.open) return null
  return (
    <div
      role="dialog"
      className={cn(
        "absolute left-1/2 top-full z-50 mt-1 max-w-[calc(100vw-1rem)] -translate-x-1/2 rounded-md border bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900",
        className
      )}
      {...props}>
      {children}
    </div>
  )
}
