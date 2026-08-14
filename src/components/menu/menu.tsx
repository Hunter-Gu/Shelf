import { DropdownMenu } from "@astryxdesign/core/DropdownMenu"
import { EllipsisIcon } from "lucide-react"
import { type MouseEvent, type PropsWithChildren } from "react"

import { useSetFocus } from "~/context/focus-context"

export type MenuItem = {
  label: string
  onClick?: () => void
  isDisabled?: boolean
}

export type MenuItems = Array<
  | MenuItem
  | { type: "divider" }
  | { type: "section"; title?: string; items: MenuItem[] }
>

type MenuProps = PropsWithChildren<{ items?: MenuItems }>

export function Menu({ items, children }: MenuProps) {
  const setFocus = useSetFocus()

  return (
    <div onClick={(event: MouseEvent<HTMLDivElement>) => event.stopPropagation()}>
      {items ? (
        <DropdownMenu
          button={{
            label: "More actions",
            variant: "ghost",
            icon: <EllipsisIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />,
            isIconOnly: true
          }}
          items={items}
          hasChevron={false}
          menuWidth={224}
          onOpenChange={setFocus}
        />
      ) : (
        <DropdownMenu
          button={{
            label: "More actions",
            variant: "ghost",
            icon: <EllipsisIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />,
            isIconOnly: true
          }}
          hasChevron={false}
          menuWidth={224}
          onOpenChange={setFocus}>
          {children}
        </DropdownMenu>
      )}
    </div>
  )
}
