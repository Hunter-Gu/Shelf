import { ChevronLeftIcon } from "lucide-react"
import { useState } from "react"

import type { Workspace } from "~/workspace-model"

import type { MenuItems } from "./menu"

// Astryx's DropdownMenu has no nested-flyout submenu support, and the panel
// is too narrow for a sideways flyout to have room anyway — this drills the
// same menu into a "Move to" sub-view instead (menu stays open throughout),
// so a long workspace list doesn't clutter the main item list.
export function useMoveToSubmenu({
  workspaces,
  current,
  onMove
}: {
  workspaces: Workspace[]
  current: Workspace
  onMove: (workspaceId: string) => void
}) {
  const [isOpen, setOpen] = useState(false)

  const items: MenuItems = [
    {
      label: "Move to",
      icon: <ChevronLeftIcon className="h-4 w-4" />,
      onClick: () => setOpen(false)
    },
    { type: "divider" },
    ...workspaces.map((space) => ({
      label: space.title,
      isDisabled: current.id === space.id,
      onClick: () => {
        if (current.id !== space.id) onMove(space.id)
        setOpen(false)
      }
    }))
  ]

  const open = () => setOpen(true)

  return {
    isOpen,
    items,
    open,
    reset: () => setOpen(false),
    // "›" signals this item drills into a sub-view rather than acting
    // immediately — the data-driven menu item type has no endContent slot
    // to put a trailing icon in instead.
    entry: { label: "Move to  ›", onClick: open }
  }
}
