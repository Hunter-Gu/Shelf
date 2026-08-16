import { XIcon } from "lucide-react"
import { cn } from "common/lib/utils"

import { faviconURL } from "~/utils/favicon"

import { Anchor } from "../anchor"

type BookmarkChipProps = {
  title: string
  url: string
  isActive: boolean
  onRemove: () => void
}

export function BookmarkChip({
  title,
  url,
  isActive,
  onRemove
}: BookmarkChipProps) {
  return (
    <div className="group relative min-w-0" role="listitem">
      <Anchor
        href={url}
        title={title}
        aria-label={title}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex h-12 w-full items-center justify-center rounded-lg outline-none transition-[background-color,box-shadow] duration-150 focus-visible:ring-2 motion-reduce:transition-none",
          isActive
            ? "bg-black/[0.13] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55)] ring-2 ring-black/20 hover:bg-black/[0.16] dark:bg-white/[0.5] dark:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.2)] dark:ring-white/65 dark:hover:bg-white/[0.56]"
            : "bg-black/[0.045] ring-black/15 hover:bg-black/[0.075] hover:shadow-sm dark:bg-white/[0.07] dark:ring-white/20 dark:hover:bg-white/[0.11]"
        )}>
        <img
          src={faviconURL(url, 64)}
          alt=""
          className="h-5 w-5 rounded object-contain"
        />
      </Anchor>
      <button
        type="button"
        aria-label={`Remove ${title}`}
        onClick={(event) => {
          event.stopPropagation()
          onRemove()
        }}
        className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/55 text-white opacity-0 outline-none transition-opacity hover:bg-black/75 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-black/30 group-focus-within:opacity-100 group-hover:opacity-100 motion-reduce:transition-none dark:bg-white/70 dark:text-gray-950 dark:hover:bg-white">
        <XIcon className="h-2.5 w-2.5" />
      </button>
    </div>
  )
}
