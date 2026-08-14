import { cn } from "common/lib/utils"
import { MoreMenu } from "@astryxdesign/core/MoreMenu"
import type { DropdownMenuOption } from "@astryxdesign/core/DropdownMenu"
import { useState, type MouseEvent } from "react"

import { useSetFocus } from "~/context/focus-context"

import styles from "./menu.module.css"

export type MenuItems = DropdownMenuOption[]

type MenuProps = { items: MenuItems }

export function Menu({ items }: MenuProps) {
  const setFocus = useSetFocus()
  const [isOpen, setIsOpen] = useState(false)

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    setFocus(open)
  }

  return (
    <div onClick={(event: MouseEvent<HTMLDivElement>) => event.stopPropagation()}>
      <MoreMenu
        label="More actions"
        items={items}
        className={cn("min-w-56", styles.scroll)}
        isMenuOpen={isOpen}
        onOpenChange={handleOpenChange}
      />
    </div>
  )
}
