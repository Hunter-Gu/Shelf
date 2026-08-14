import { Divider } from "@astryxdesign/core/Divider"
import { DropdownMenu, DropdownMenuItem } from "@astryxdesign/core/DropdownMenu"
import { EllipsisIcon } from "lucide-react"
import { type MouseEvent } from "react"

import { useSetFocus } from "~/context/focus-context"

export type MenuItem = {
  id?: string
  label: string
  onClick?: () => void
  isDisabled?: boolean
}

export type MenuItems = Array<
  | MenuItem
  | { type: "divider" }
  | { type: "section"; title?: string; items: MenuItem[] }
>

type MenuProps = { items: MenuItems }

function renderItems(items: MenuItems) {
  return items.map((item, index) => {
    if ("type" in item && item.type === "divider") {
      return <Divider key={`divider-${index}`} />
    }

    if ("type" in item && item.type === "section") {
      return (
        <div key={`section-${index}`} role="group" aria-label={item.title}>
          {item.title ? (
            <div
              aria-hidden="true"
              className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400">
              {item.title}
            </div>
          ) : null}
          {item.items.map((subItem, subIndex) => (
            <DropdownMenuItem
              key={subItem.id ?? `item-${index}-${subIndex}`}
              label={subItem.label}
              onClick={subItem.onClick}
              isDisabled={subItem.isDisabled}
            />
          ))}
        </div>
      )
    }

    return (
      <DropdownMenuItem
        key={item.id ?? `item-${index}`}
        label={item.label}
        onClick={item.onClick}
        isDisabled={item.isDisabled}
      />
    )
  })
}

export function Menu({ items }: MenuProps) {
  const setFocus = useSetFocus()

  return (
    <div onClick={(event: MouseEvent<HTMLDivElement>) => event.stopPropagation()}>
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
        {renderItems(items)}
      </DropdownMenu>
    </div>
  )
}
