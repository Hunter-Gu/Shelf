import { FolderInputIcon } from "lucide-react"

import { useAppContext } from "~/app/app-context"

import { Menu, type MenuItems } from "./menu"

type MoveToMenuProps = {
  onMove: (workspaceId: string) => void
}

// A standalone trigger rather than a "Move to" item inside the "..." menu —
// Astryx's DropdownMenuItem unconditionally closes its parent menu on any
// click (DropdownMenuItem.tsx's handleClick), so a workspace list nested a
// level deeper in that same menu can never stay open across the click that
// would reveal it.
export function MoveToMenu({ onMove }: MoveToMenuProps) {
  const { workspace } = useAppContext()
  const { workspaces, currentWorkspace: current } = workspace

  const items: MenuItems = workspaces.map((space) => ({
    label: space.title,
    isDisabled: current.id === space.id,
    onClick: () => {
      if (current.id !== space.id) onMove(space.id)
    }
  }))

  return (
    <Menu
      items={items}
      label="Move to"
      icon={
        <FolderInputIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      }
      className="min-w-40"
    />
  )
}
