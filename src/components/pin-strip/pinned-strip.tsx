import { IconButton as AstryxIconButton } from "@astryxdesign/core/IconButton"
import { cn } from "common/lib/utils"
import { PinIcon } from "lucide-react"
import { useMemo } from "react"

import { useAppContext } from "~/app/app-context"
import { collectTreeUrls, type Folder } from "~/bookmark-model"
import { Anchor } from "~/components/anchor"
import {
  ItemActionsContainer,
  ItemContainer
} from "~/components/folder-tree/styled"
import { faviconURL } from "~/utils/favicon"

import { normalizeBookmarkUrl } from "./bookmark-url"

// Pin copies live in one flat, global "Pins (Markit)" folder — which
// workspace a pin belongs to isn't stored anywhere, it's read off wherever
// the *source* bookmark currently lives. So scoping to the current
// workspace means intersecting the global pin list against this
// workspace's own tree, not filtering the pin folder itself.
export function PinnedStrip({ tree }: { tree: Folder }) {
  const { pins, tabs, workspace } = useAppContext()
  const hue = workspace.currentWorkspace.color ?? "gray"
  const workspaceUrls = useMemo(() => collectTreeUrls(tree), [tree])
  const items = pins.pinnedItems.filter((item) => workspaceUrls.has(item.url))
  const activeUrl = normalizeBookmarkUrl(tabs.activeTab?.url)

  if (items.length === 0) return null

  return (
    <div
      className="mx-3"
      role="list"
      aria-label="Pinned bookmarks">
      {items.map((item) => {
        const isActive = normalizeBookmarkUrl(item.url) === activeUrl

        return (
          <ItemContainer
            key={item.id}
            role="listitem"
            className={cn(
              isActive && "bg-black/10 dark:bg-white/10"
            )}>
            <img
              src={faviconURL(item.url)}
              alt={item.title}
              className="mr-2 h-4 w-4 rounded"
            />
            <Anchor
              href={item.url}
              title={item.title}
              aria-label={item.title}
              aria-current={isActive ? "page" : undefined}
              className="flex-1 overflow-hidden text-ellipsis text-nowrap text-left text-sm text-gray-700 group-hover:mr-10 dark:text-gray-200">
              {item.title}
            </Anchor>
            <ItemActionsContainer>
              <AstryxIconButton
                label="Unpin"
                tooltip="Unpin"
                variant="ghost"
                icon={
                  <PinIcon
                    className="h-4 w-4"
                    fill="currentColor"
                    style={{ color: `var(--color-icon-${hue})` }}
                  />
                }
                onClick={() => void pins.unpin(item.url)}
              />
            </ItemActionsContainer>
          </ItemContainer>
        )
      })}
    </div>
  )
}
