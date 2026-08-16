import { TextInput } from "@astryxdesign/core/TextInput"
import { cn } from "common/lib/utils"
import { useRef } from "react"

import { useAppContext } from "~/app/app-context"
import { BookmarkButton } from "~/components/bookmark-button/bookmark-button"
import { clsx } from "~/components/clsx"
import { Editable, useEditable } from "~/components/editable"
import { FolderTree } from "~/components/folder-tree"
import { SpaceMenu } from "~/components/menu/space-menu"
import { PinHint } from "~/components/pin-hint"
import { FavoritesStrip } from "~/components/pin-strip/favorites-strip"
import { PinnedStrip } from "~/components/pin-strip/pinned-strip"
import { useFocusSearchShortcut } from "~/hooks/use-focus-search-shortcut"
import { useSearch } from "~/hooks/use-search"
import type { Workspace } from "~/workspace-model"

const TitleContainer = clsx.div(
  "relative flex justify-between items-center mx-3 mb-2 px-3 py-2 rounded-2xl"
)
const Title = clsx.span(
  "text-base capitalize font-bold text-black dark:text-white"
)
const ActionsContainer = clsx.div("flex items-center gap-2")

type SidebarProps = {
  onEdit?: (workspace: Workspace) => void
}

export function Sidebar({ onEdit }: SidebarProps) {
  const { bookmarks, workspace, pins } = useAppContext()
  const currentSpace = workspace.currentWorkspace
  const { searchText, handleSearch } = useSearch()
  const searchInputRef = useRef<HTMLInputElement>(null)
  useFocusSearchShortcut(searchInputRef)
  const titleRef = useRef<HTMLDivElement>(null)
  const { isEditing, setEditing, handleChange } = useEditable((event) => {
    void workspace.update(currentSpace.id, (nextWorkspace) => {
      nextWorkspace.title = (event.target as HTMLInputElement).value
    })
  })

  const tree = bookmarks.visibleTree
    ? bookmarks.getTreeByWorkspaceId({
        currentWorkspace: currentSpace,
        workspaces: workspace.workspaces,
        sourceTree: bookmarks.visibleTree,
        excludeIds: [pins.pinsFolderId, pins.favoritesFolderId].filter(
          (id): id is string => id !== undefined
        )
      })
    : null

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <FavoritesStrip />

      <div
        className={cn(
          "mx-3 mb-4",
          pins.favoriteItems.length ? "mt-2" : "mt-4"
        )}>
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
        ref={titleRef}
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
              anchorRef={titleRef}
            />
          ) : null}
        </ActionsContainer>
      </TitleContainer>

      {tree ? <PinnedStrip tree={tree} /> : null}

      <FolderTree tree={tree} />
    </div>
  )
}
