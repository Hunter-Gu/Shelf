import { PinIcon, StarIcon } from "lucide-react"

import { useAppContext } from "~/app/app-context"

import { Menu, type MenuItems } from "./menu"

type PinFavoriteMenuProps = {
  item: { title: string; url: string }
}

// Pin and favorite are two highlights on the same axis rather than two
// independent row buttons, so they share one inline trigger. The button's
// icon reflects the current state (pin when pinned, star when favorited,
// outline otherwise) and the menu offers the toggle for each.
export function PinFavoriteMenu({ item }: PinFavoriteMenuProps) {
  const { pins, workspace } = useAppContext()
  const isPinned = pins.isPinned(item.url)
  const isFavorite = pins.isFavorite(item.url)
  const hue = workspace.currentWorkspace.color ?? "gray"

  const items: MenuItems = [
    {
      label: isPinned ? "Unpin" : "Pin to this workspace",
      onClick: () =>
        void (isPinned ? pins.unpin(item.url) : pins.pin(item))
    },
    {
      label: isFavorite ? "Remove from Favorites" : "Add to Favorites",
      onClick: () =>
        void (isFavorite ? pins.unfavorite(item.url) : pins.favorite(item))
    }
  ]

  const icon = isPinned ? (
    <PinIcon
      className="h-4 w-4"
      fill="currentColor"
      style={{ color: `var(--color-icon-${hue})` }}
    />
  ) : isFavorite ? (
    <StarIcon className="h-4 w-4 text-amber-500" fill="currentColor" />
  ) : (
    <PinIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
  )

  return <Menu items={items} label="Pin or favorite" icon={icon} />
}
