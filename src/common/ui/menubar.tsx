import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type MouseEvent,
  type PropsWithChildren,
  type RefObject
} from "react"

import { cn } from "../lib/utils"

type MenuValue = {
  open: boolean
  setOpen: (open: boolean) => void
  rootRef: RefObject<HTMLDivElement | null>
}
const MenuContext = createContext<MenuValue | null>(null)

export function Menubar({
  children,
  onValueChange,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>> & {
  onValueChange?: (value: string) => void
}) {
  const [open, setOpenState] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const setOpen = (next: boolean) => {
    setOpenState(next)
    onValueChange?.(next ? "menu" : "")
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
    <MenuContext.Provider value={{ open, setOpen, rootRef }}>
      <div
        ref={rootRef}
        className={cn("relative flex items-center", className)}
        {...props}>
        {children}
      </div>
    </MenuContext.Provider>
  )
}

type SubMenuValue = { open: boolean; setOpen: (open: boolean) => void }
const SubMenuContext = createContext<SubMenuValue | null>(null)

export function MenubarMenu({ children }: PropsWithChildren) {
  return <div className="relative">{children}</div>
}
export function MenubarTrigger({
  children,
  className,
  onClick,
  ...props
}: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) {
  const context = useContext(MenuContext)
  return (
    <button
      type="button"
      aria-haspopup="menu"
      aria-expanded={context?.open ?? false}
      className={className}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) context?.setOpen(!context.open)
      }}
      {...props}>
      {children}
    </button>
  )
}
export function MenubarContent({
  children,
  className,
  container: _container,
  ...props
}: PropsWithChildren<
  HTMLAttributes<HTMLDivElement> & { container?: HTMLElement | null }
>) {
  const context = useContext(MenuContext)
  return context?.open ? (
    <div
      role="menu"
      className={cn(
        "absolute right-0 top-full z-50 max-h-[calc(100vh-1rem)] min-w-40 overflow-y-auto rounded-md border bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-900",
        className
      )}
      {...props}>
      {children}
    </div>
  ) : null
}
export function MenubarItem({
  children,
  className,
  onClick,
  onKeyDown,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  const context = useContext(MenuContext)
  return (
    <div
      role="menuitem"
      tabIndex={0}
      className={cn(
        "cursor-pointer rounded px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-800",
        className
      )}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) context?.setOpen(false)
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onClick?.(event as unknown as MouseEvent<HTMLDivElement>)
          context?.setOpen(false)
        }
      }}
      {...props}>
      {children}
    </div>
  )
}
export function MenubarSeparator({
  className,
  ...props
}: HTMLAttributes<HTMLHRElement>) {
  return (
    <hr
      className={cn("my-1 border-gray-200 dark:border-gray-700", className)}
      {...props}
    />
  )
}
export function MenubarSub({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false)
  return (
    <SubMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative">{children}</div>
    </SubMenuContext.Provider>
  )
}
export function MenubarSubTrigger({
  children,
  className,
  onClick,
  onKeyDown,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  const context = useContext(SubMenuContext)
  return (
    <div
      role="menuitem"
      aria-haspopup="menu"
      aria-expanded={context?.open ?? false}
      tabIndex={0}
      className={cn(
        "cursor-pointer rounded px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-800",
        className
      )}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) context?.setOpen(!context.open)
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          context?.setOpen(!context.open)
        }
      }}
      {...props}>
      {children}
    </div>
  )
}
export function MenubarSubContent({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  const context = useContext(SubMenuContext)
  return context?.open ? (
    <div
      role="menu"
      className={cn(
        "ml-2 mt-1 min-w-36 border-l border-gray-200 py-1 pl-2 dark:border-gray-700",
        className
      )}
      {...props}>
      {children}
    </div>
  ) : null
}
export function MenubarCheckboxItem({
  children,
  checked,
  className,
  onClick,
  onKeyDown,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement> & { checked?: boolean }>) {
  const context = useContext(MenuContext)
  return (
    <div
      role="menuitemcheckbox"
      aria-checked={checked}
      tabIndex={0}
      className={cn(
        "cursor-pointer rounded px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-800",
        className
      )}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) context?.setOpen(false)
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onClick?.(event as unknown as MouseEvent<HTMLDivElement>)
          context?.setOpen(false)
        }
      }}
      {...props}>
      {children}
    </div>
  )
}
