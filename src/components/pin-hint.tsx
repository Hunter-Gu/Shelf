import { PuzzleIcon, XIcon } from "lucide-react"

import { usePinHint } from "~/hooks/use-pin-hint"

export function PinHint() {
  const { isVisible, dismiss } = usePinHint()

  if (!isVisible) return null

  return (
    <div className="mx-3 flex items-center gap-2 rounded-full bg-[var(--color-background-purple)] px-3 py-2 text-xs text-[var(--color-text-purple)]">
      <PuzzleIcon className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1">
        Pin Markit to your toolbar so it's one click next time.
      </span>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={dismiss}
        className="flex shrink-0 items-center justify-center rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10">
        <XIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
