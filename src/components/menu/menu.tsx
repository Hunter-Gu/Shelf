import { cn } from "common/lib/utils"
import { MoreMenu } from "@astryxdesign/core/MoreMenu"
import type { DropdownMenuOption } from "@astryxdesign/core/DropdownMenu"
import { useState, type MouseEvent, type ReactNode } from "react"

import { useSetFocus } from "~/context/focus-context"

import styles from "./menu.module.css"

export type MenuItems = DropdownMenuOption[]

type MenuProps = {
  items: MenuItems
  onOpenChange?: (open: boolean) => void
  label?: string
  icon?: ReactNode
  className?: string
}

export function Menu({
  items,
  onOpenChange,
  label = "More actions",
  icon,
  className = "min-w-56"
}: MenuProps) {
  const setFocus = useSetFocus()
  const [isOpen, setIsOpen] = useState(false)

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    setFocus(open)
    onOpenChange?.(open)
  }

  return (
    <div onClick={(event: MouseEvent<HTMLDivElement>) => event.stopPropagation()}>
      <MoreMenu
        label={label}
        icon={icon}
        items={items}
        className={cn(className, styles.scroll)}
        isMenuOpen={isOpen}
        onOpenChange={handleOpenChange}
      />
    </div>
  )
}
