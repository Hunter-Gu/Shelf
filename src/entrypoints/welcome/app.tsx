import { Button } from "@astryxdesign/core/Button"
import { Theme as AstryxTheme } from "@astryxdesign/core/theme"
import { neutralTheme } from "@astryxdesign/theme-neutral/built"
import {
  ArrowRightLeftIcon,
  FolderInputIcon,
  KeyboardIcon,
  PuzzleIcon
} from "lucide-react"
import { browser } from "wxt/browser"

import { useOpenSidePanel } from "~/hooks/use-open-side-panel"

function WelcomeContent() {
  const { state, open } = useOpenSidePanel()

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-black/5 bg-white/60 p-8 text-center shadow-[0_30px_60px_-28px_rgba(30,20,40,0.25)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]">
        <img src="/icon/128.png" alt="" className="mx-auto mb-5 h-14 w-14" />

        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">
          Shelf is installed
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Your bookmarks live in a side panel next to your tabs.
        </p>

        <Button
          className="mt-6 w-full"
          variant="primary"
          isDisabled={state === "opening"}
          label={
            state === "opened"
              ? "Opened — check the right side of your window"
              : state === "opening"
                ? "Opening…"
                : "Open Shelf"
          }
          onClick={open}
        />

        {state === "error" && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">
            Couldn't open it automatically — click the Shelf icon in your
            toolbar instead.
          </p>
        )}

        <div className="mt-8 border-t border-black/5 pt-6 text-left dark:border-white/10">
          <p className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
            <PuzzleIcon className="h-4 w-4" />
            Pin it so it's easy to find next time
          </p>
          <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-300">
            Click the puzzle-piece icon next to your address bar, then the pin
            next to Shelf.
          </p>
        </div>

        <div className="mt-6 border-t border-black/5 pt-6 text-left dark:border-white/10">
          <p className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
            <FolderInputIcon className="h-4 w-4" />
            Already have bookmark folders?
          </p>
          <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-300">
            Pick the ones you want as spaces, and name them as you go.{" "}
            <a
              className="underline underline-offset-2 hover:no-underline"
              href="/folders-to-spaces.html">
              Turn folders into spaces
            </a>
          </p>
        </div>

        <div className="mt-6 border-t border-black/5 pt-6 text-left dark:border-white/10">
          <p className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
            <ArrowRightLeftIcon className="h-4 w-4" />
            Moving from Arc?
          </p>
          <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-300">
            Bring your Arc spaces, pinned tabs and favorites over in one step.{" "}
            <a
              className="underline underline-offset-2 hover:no-underline"
              href="/import-arc.html">
              Import from Arc
            </a>
          </p>
        </div>

        <div className="mt-6 border-t border-black/5 pt-6 text-left dark:border-white/10">
          <p className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
            <KeyboardIcon className="h-4 w-4" />
            Or open it with a keyboard shortcut
          </p>
          <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-300">
            <kbd className="rounded border border-black/10 bg-black/5 px-1.5 py-0.5 font-mono text-xs dark:border-white/10 dark:bg-white/10">
              Ctrl+Shift+K
            </kbd>{" "}
            opens Shelf and jumps straight to search.{" "}
            <button
              type="button"
              className="underline underline-offset-2 hover:no-underline"
              onClick={() =>
                void browser.tabs.create({
                  url: "chrome://extensions/shortcuts"
                })
              }>
              Change the shortcut
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AstryxTheme theme={neutralTheme} mode="system">
      <WelcomeContent />
    </AstryxTheme>
  )
}
