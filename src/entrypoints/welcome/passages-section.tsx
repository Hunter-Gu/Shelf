import { HighlighterIcon } from "lucide-react"

import { COLOR_VALUES } from "~/selection-bookmarks/colors"

export function PassagesSection() {
  return (
    <div className="mt-6 border-t border-black/5 pt-6 text-left dark:border-white/10">
      <p className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
        <HighlighterIcon className="h-4 w-4" />
        <mark
          className="rounded-[2px] px-1 text-[#1c1917]"
          style={{ backgroundColor: COLOR_VALUES.yellow }}>
          Save passages, not just pages
        </mark>
        <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-white/10 dark:text-gray-300">
          New
        </span>
      </p>
      <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-300">
        Select text on any page and pick a color to save it with the page. It
        stays highlighted when you come back.{" "}
        <a
          className="underline underline-offset-2 hover:no-underline"
          href="/selection-settings.html">
          Colors and settings
        </a>
      </p>
    </div>
  )
}
