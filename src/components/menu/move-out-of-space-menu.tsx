import { FolderOutputIcon } from "lucide-react"

import { useAppContext } from "~/app/app-context"

import { Menu, type MenuItems } from "./menu"

type MoveOutOfSpaceMenuProps = {
  workspaceId: string
}

// The inverse of "Turn into Space": move a Normal workspace back under
// another workspace and demote it to a regular folder, keeping its contents.
export function MoveOutOfSpaceMenu({
  workspaceId
}: MoveOutOfSpaceMenuProps) {
  const { workspace } = useAppContext()
  const { workspaces, moveOutOfSpace } = workspace

  const items: MenuItems = workspaces
    .filter((space) => space.id !== workspaceId)
    .map((space) => ({
      label: space.title,
      onClick: () => void moveOutOfSpace(workspaceId, space.id)
    }))

  return (
    <Menu
      items={items}
      label="Move out of Spaces"
      icon={
        <FolderOutputIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      }
      className="min-w-40"
    />
  )
}
