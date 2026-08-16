import { TextInput } from "@astryxdesign/core/TextInput"
import { cn } from "common/lib/utils"
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react"
import { useRef, type CSSProperties, type RefObject } from "react"

import { useAppContext } from "~/app/app-context"
import { filterBookmarksByUrl } from "~/bookmark-model"
import { BookmarkButton } from "~/components/bookmark-button/bookmark-button"
import {
  BookmarkDndProvider,
  resolveAppendDropTarget,
  useBookmarkDrop
} from "~/components/bookmark-dnd"
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
  "group/workspace relative mx-3 flex items-center justify-between rounded-2xl bg-transparent px-3 py-2 hover:bg-[var(--workspace-background)]"
)
const Title = clsx.div(
  "flex min-w-0 items-center text-base capitalize font-bold text-black dark:text-white"
)
const ActionsContainer = clsx.div("flex items-center gap-2")

type SidebarProps = {
  onEdit?: (workspace: Workspace) => void
}

function SearchAndFavorites({
  searchInputRef,
  searchText,
  onSearch
}: {
  searchInputRef: RefObject<HTMLInputElement | null>
  searchText: string
  onSearch: (text: string) => void
}) {
  const { pins } = useAppContext()
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const isFavoriteEmpty = pins.favoriteItems.length === 0
  const { drop, isOver } = useBookmarkDrop(searchContainerRef, () =>
    resolveAppendDropTarget(
      "favorite",
      isFavoriteEmpty ? (pins.favoritesFolderId ?? "") : "",
      0
    )
  )
  drop(searchContainerRef)

  return (
    <>
      <div
        ref={searchContainerRef}
        className={cn(
          "mx-3 rounded-lg",
          isOver && "ring-2 ring-black/20 dark:ring-white/30"
        )}>
        <TextInput
          ref={searchInputRef}
          label="Search bookmarks"
          isLabelHidden
          placeholder="Hinted search text"
          onChange={onSearch}
          value={searchText}
        />
      </div>

      <FavoritesStrip />
    </>
  )
}

function WorkspaceTitle({
  workspaceTree,
  onEdit
}: {
  workspaceTree: ReturnType<
    ReturnType<typeof useAppContext>["bookmarks"]["getTreeByWorkspaceId"]
  >
  onEdit?: (workspace: Workspace) => void
}) {
  const { pins, workspace } = useAppContext()
  const currentSpace = workspace.currentWorkspace
  const titleRef = useRef<HTMLDivElement>(null)
  const { isEditing, setEditing, handleChange } = useEditable((event) => {
    void workspace.update(currentSpace.id, (nextWorkspace) => {
      nextWorkspace.title = (event.target as HTMLInputElement).value
    })
  })
  const { drop, isOver } = useBookmarkDrop(titleRef, () =>
    resolveAppendDropTarget(
      "pin",
      pins.pinsFolderId ?? "",
      pins.pinnedItems.length
    )
  )
  drop(titleRef)

  const isPinsCollapsed = currentSpace.isPinsCollapsed
  const togglePins = () => {
    void workspace.update(currentSpace.id, (nextWorkspace) => {
      nextWorkspace.isPinsCollapsed = !nextWorkspace.isPinsCollapsed
    })
  }

  return (
    <TitleContainer
      ref={titleRef}
      className={cn(
        isOver &&
          "bg-[var(--workspace-background)] ring-1 ring-black/15 dark:ring-white/20"
      )}
      style={
        {
          "--workspace-background": `var(--color-background-${currentSpace.color ?? "gray"})`
        } as CSSProperties
      }>
      <Title>
        <button
          type="button"
          className="group/toggle relative mr-3 inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded text-gray-500 outline-none hover:text-gray-700 focus-visible:ring-2 focus-visible:ring-black/30 dark:text-gray-300 dark:hover:text-white dark:focus-visible:ring-white/40"
          aria-label={
            isPinsCollapsed
              ? "Expand pinned bookmarks"
              : "Collapse pinned bookmarks"
          }
          aria-controls="workspace-pinned-bookmarks"
          aria-expanded={!isPinsCollapsed}
          onClick={togglePins}>
          {currentSpace.logo ? (
            <span
              aria-hidden
              className="absolute inset-0 flex items-center justify-center transition-opacity group-hover/workspace:opacity-0 group-focus-visible/toggle:opacity-0">
              {currentSpace.logo}
            </span>
          ) : null}
          {isPinsCollapsed ? (
            <ChevronRightIcon
              aria-hidden
              className={cn(
                "h-4 w-4 transition-opacity",
                currentSpace.logo &&
                  "opacity-0 group-hover/workspace:opacity-100 group-focus-visible/toggle:opacity-100"
              )}
            />
          ) : (
            <ChevronDownIcon
              aria-hidden
              className={cn(
                "h-4 w-4 transition-opacity",
                currentSpace.logo &&
                  "opacity-0 group-hover/workspace:opacity-100 group-focus-visible/toggle:opacity-100"
              )}
            />
          )}
        </button>
        <Editable
          isEditing={isEditing}
          text={currentSpace.title}
          preview={<span>{currentSpace.title}</span>}
          onChange={handleChange}
        />
      </Title>
      <ActionsContainer>
        <BookmarkButton id={currentSpace.id} />
        {workspaceTree ? (
          <SpaceMenu
            item={workspaceTree}
            onRename={() => setEditing(true)}
            onEdit={onEdit}
            anchorRef={titleRef}
          />
        ) : null}
      </ActionsContainer>
    </TitleContainer>
  )
}

export function Sidebar({ onEdit }: SidebarProps) {
  const { bookmarks, workspace, pins } = useAppContext()
  const currentSpace = workspace.currentWorkspace
  const { searchText, handleSearch } = useSearch()
  const searchInputRef = useRef<HTMLInputElement>(null)
  useFocusSearchShortcut(searchInputRef)
  const isPinsCollapsed = currentSpace.isPinsCollapsed

  const getWorkspaceTree = (sourceTree: NonNullable<typeof bookmarks.tree>) =>
    bookmarks.getTreeByWorkspaceId({
      currentWorkspace: currentSpace,
      workspaces: workspace.workspaces,
      sourceTree,
      excludeIds: [pins.pinsFolderId, pins.favoritesFolderId].filter(
        (id): id is string => id !== undefined
      )
    })
  const workspaceTree = bookmarks.visibleTree
    ? getWorkspaceTree(bookmarks.visibleTree)
    : null
  const sourceWorkspaceTree = bookmarks.tree
    ? getWorkspaceTree(bookmarks.tree)
    : null
  const hiddenBookmarkUrls = new Set([...pins.pinnedUrls, ...pins.favoriteUrls])
  const tree = workspaceTree
    ? filterBookmarksByUrl(workspaceTree, hiddenBookmarkUrls)
    : null

  return (
    <BookmarkDndProvider workspaceTree={sourceWorkspaceTree}>
      <div className="flex min-h-0 flex-1 flex-col gap-2 pt-3">
        <PinHint />

        <SearchAndFavorites
          searchInputRef={searchInputRef}
          searchText={searchText}
          onSearch={handleSearch}
        />

        <WorkspaceTitle workspaceTree={workspaceTree} onEdit={onEdit} />

        <div
          id="workspace-pinned-bookmarks"
          className={isPinsCollapsed ? "hidden" : "contents"}>
          {workspaceTree ? <PinnedStrip tree={workspaceTree} /> : null}
        </div>

        <hr className="mx-3 border-0 border-t border-black/10 dark:border-white/10" />

        <FolderTree tree={tree} />
      </div>
    </BookmarkDndProvider>
  )
}
