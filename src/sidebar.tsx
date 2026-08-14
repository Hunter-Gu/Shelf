import { cn } from "common/lib/utils"
import { TextInput } from "@astryxdesign/core/TextInput"
import { useRef } from "react"

import { useAppContext } from "~/app/app-context"
import { BookmarkButton } from "~/components/bookmark-button/bookmark-button"
import { clsx } from "~/components/clsx"
import { Editable, useEditable } from "~/components/editable"
import { FolderTree } from "~/components/folder-tree"
import { SpaceMenu } from "~/components/menu/space-menu"
import { PinHint } from "~/components/pin-hint"
import { useFocusSearchShortcut } from "~/hooks/use-focus-search-shortcut"
import { useSearch } from "~/hooks/use-search"
import type { Workspace } from "~/workspace-model"

const TitleContainer = clsx.div(
  "flex justify-between items-center mx-3 mb-2 px-3 py-2 rounded-2xl"
)
const Title = clsx.span(
  "text-base capitalize font-bold text-black dark:text-white"
)
const ActionsContainer = clsx.div("flex items-center gap-2")

type SidebarProps = {
  onEdit?: (workspace: Workspace) => void
}

export function Sidebar({ onEdit }: SidebarProps) {
  const { bookmarks, workspace } = useAppContext()
  const currentSpace = workspace.currentWorkspace
  const { searchText, handleSearch } = useSearch()
  const searchInputRef = useRef<HTMLInputElement>(null)
  useFocusSearchShortcut(searchInputRef)
  const { isEditing, setEditing, handleChange } = useEditable((event) => {
    void workspace.update(currentSpace.id, (nextWorkspace) => {
      nextWorkspace.title = (event.target as HTMLInputElement).value
    })
  })

  const tree = bookmarks.visibleTree
    ? bookmarks.getTreeByWorkspaceId({
        currentWorkspace: currentSpace,
        workspaces: workspace.workspaces,
        sourceTree: bookmarks.visibleTree
      })
    : null

  return (
    <>
      <div className="mx-3 my-4">
        <TextInput
          ref={searchInputRef}
          label="Search bookmarks"
          isLabelHidden
          placeholder="Hinted search text"
          onChange={handleSearch}
          value={searchText}
        />
      </div>

      <PinHint />

      <TitleContainer
        style={{
          backgroundColor: `var(--color-background-${currentSpace.color ?? "gray"})`
        }}>
        <Title>
          <span className={cn(currentSpace.logo && "mr-3")}>
            {currentSpace.logo}
          </span>
          <Editable
            isEditing={isEditing}
            text={currentSpace.title}
            preview={<span>{currentSpace.title}</span>}
            onChange={handleChange}
          />
        </Title>
        <ActionsContainer>
          <BookmarkButton id={currentSpace.id} />
          {tree ? (
            <SpaceMenu
              item={tree}
              onRename={() => setEditing(true)}
              onEdit={onEdit}
            />
          ) : null}
        </ActionsContainer>
      </TitleContainer>

      <FolderTree tree={tree} />
    </>
  )
}
