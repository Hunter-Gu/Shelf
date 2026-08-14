import { Button } from "@astryxdesign/core/Button"
import { Theme as AstryxTheme } from "@astryxdesign/core/theme"
import { neutralTheme } from "@astryxdesign/theme-neutral/built"
import { PanelRightOpen, PuzzleIcon } from "lucide-react"
import { useState } from "react"
import { browser } from "wxt/browser"

type OpenState = "idle" | "opening" | "opened" | "error"

function WelcomeContent() {
  const [state, setState] = useState<OpenState>("idle")

  const handleOpen = async () => {
    setState("opening")
    try {
      const window = await browser.windows.getCurrent()
      if (!window.id) throw new Error("no window id")
      await browser.sidePanel.open({ windowId: window.id })
      setState("opened")
    } catch {
      setState("error")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-black/5 bg-white/60 p-8 text-center shadow-[0_30px_60px_-28px_rgba(30,20,40,0.25)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-background-purple)]">
          <PanelRightOpen className="h-6 w-6 text-[var(--color-icon-purple)]" />
        </div>

        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">
          Markit is installed
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
                : "Open Markit"
          }
          onClick={handleOpen}
        />

        {state === "error" && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">
            Couldn't open it automatically — click the Markit icon in your
            toolbar instead.
          </p>
        )}

        <div className="mt-8 border-t border-black/5 pt-6 text-left dark:border-white/10">
          <p className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
            <PuzzleIcon className="h-4 w-4" />
            Pin it so it's easy to find next time
          </p>
          <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-300">
            Click the puzzle-piece icon next to your address bar, then the
            pin next to Markit.
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
