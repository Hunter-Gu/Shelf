import { cn } from "common/lib/utils"
import { PinIcon } from "lucide-react"
import { useMemo } from "react"

import { useAppContext } from "~/app/app-context"
import { collectTreeUrls, type Folder } from "~/bookmark-model"
import { Anchor } from "~/components/anchor"
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
      className="mx-3 mb-1 space-y-1"
      role="list"
      aria-label="Pinned bookmarks">
      {items.map((item) => {
        const isActive = normalizeBookmarkUrl(item.url) === activeUrl

        return (
          <div
            key={item.id}
            role="listitem"
            className={cn(
              "group relative flex min-h-14 items-center rounded-2xl px-4 transition-[background-color,box-shadow] focus-within:ring-2 focus-within:ring-black/10 motion-reduce:transition-none dark:focus-within:ring-white/15",
              isActive
                ? "bg-white/80 shadow-[0_1px_2px_rgba(20,20,30,0.06),0_8px_24px_rgba(20,20,30,0.04)] ring-1 ring-black/[0.035] dark:bg-white/[0.11] dark:ring-white/[0.06]"
                : "hover:bg-black/[0.045] dark:hover:bg-white/[0.06]"
            )}>
            <img
              src={faviconURL(item.url, 48)}
              alt=""
              className="mr-4 h-6 w-6 shrink-0 rounded-md object-contain"
            />
            <Anchor
              href={item.url}
              title={item.title}
              aria-label={item.title}
              className={cn(
                "min-w-0 flex-1 truncate py-4 pr-8 text-left text-[15px] leading-5 outline-none",
                isActive
                  ? "font-medium text-gray-900 dark:text-white"
                  : "text-gray-600 dark:text-gray-300"
              )}>
              {item.title}
            </Anchor>
            <button
              type="button"
              aria-label={`Unpin ${item.title}`}
              className="absolute right-3 flex h-8 w-8 items-center justify-center rounded-lg opacity-0 outline-none transition-[background-color,opacity] hover:bg-black/[0.06] focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-black/15 group-focus-within:opacity-100 group-hover:opacity-100 motion-reduce:transition-none dark:hover:bg-white/[0.08] dark:focus-visible:ring-white/20"
              onClick={() => void pins.unpin(item.url)}>
              <PinIcon
                className="h-4 w-4"
                fill="currentColor"
                style={{ color: `var(--color-icon-${hue})` }}
              />
            </button>
          </div>
        )
      })}
    </div>
  )
}
