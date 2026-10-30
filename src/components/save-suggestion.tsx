import { XIcon } from "lucide-react"

import type { useSaveSuggestion } from "~/save-suggestion/use-save-suggestion"

export function SaveSuggestion({
  suggestion,
  move,
  dismiss,
  setHovered
}: ReturnType<typeof useSaveSuggestion>) {
  if (!suggestion) return null

  return (
    <div
      role="status"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="mx-3 flex items-center gap-2 rounded-xl bg-[var(--color-background-gray)] py-1.5 pr-1.5 pl-3 text-xs text-[var(--color-text-gray)] transition-opacity duration-200 starting:opacity-0">
      <span className="min-w-0 flex-1 leading-4">
        Saved to {suggestion.savedTo}. Your other {suggestion.host} bookmarks
        are in <b className="font-semibold">{suggestion.label}</b>.
      </span>
      <button
        type="button"
        onClick={() => void move()}
        className="shrink-0 rounded-lg bg-white px-2.5 py-1 font-medium shadow-sm hover:bg-white/80 dark:bg-white/15 dark:hover:bg-white/20">
        Move
      </button>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={dismiss}
        className="flex shrink-0 items-center justify-center rounded-full p-1 hover:bg-black/10 dark:hover:bg-white/10">
        <XIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
