import { RadioList, RadioListItem } from "@astryxdesign/core/RadioList"
import { Switch } from "@astryxdesign/core/Switch"
import { Theme as AstryxTheme } from "@astryxdesign/core/theme"
import { neutralTheme } from "@astryxdesign/theme-neutral/built"
import { ArrowDown, ArrowUp, Highlighter } from "lucide-react"

import {
  COLOR_LABELS,
  COLOR_VALUES,
  HIGHLIGHT_COLORS,
  isHighlightColor
} from "~/selection-bookmarks/colors"

import { usePreferences } from "./use-preferences"

const muted = "text-sm leading-6 text-gray-600 dark:text-gray-300"
const section = "border-t border-black/5 py-6 dark:border-white/10"

function SelectionSettings() {
  const { value, saving, error, update } = usePreferences()
  return (
    <main className="mx-auto w-full max-w-xl px-6 py-16 sm:py-24">
      <a
        href="/welcome.html"
        className="inline-flex items-center gap-2 text-sm font-semibold">
        <img src="/icon/32.png" alt="" className="h-5 w-5" />
        Shelf
      </a>
      <div className="mt-8 flex items-center gap-3">
        <Highlighter size={24} aria-hidden="true" />
        <h1 className="text-2xl font-semibold tracking-tight">
          Text selection bookmarks
        </h1>
      </div>
      <p className={`mt-3 mb-8 ${muted}`}>
        Save the words you want to come back to, right where you read them.
      </p>

      {!value && !error && <p className={muted}>Loading settings…</p>}
      {value && (
        <>
          <section className={section} aria-labelledby="enabled-label">
            <div className="flex items-center justify-between gap-6">
              <div>
                <h2 id="enabled-label" className="font-medium">
                  Highlight text on web pages
                </h2>
                <p id="enabled-description" className={`mt-1 ${muted}`}>
                  Select text to save it with its page in the color you pick,
                  and see it highlighted when you come back. Also adds a save
                  option to the right-click menu.
                </p>
              </div>
              <Switch
                label="Highlight text on web pages"
                isLabelHidden
                value={value.enabled}
                aria-labelledby="enabled-label"
                aria-describedby="enabled-description"
                isDisabled={saving}
                onChange={(enabled) => void update({ enabled })}
              />
            </div>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Turning this off keeps your saved bookmarks and highlights.
            </p>
          </section>

          <fieldset className={section} disabled={saving}>
            <legend className="sr-only">Default color</legend>
            <h2 className="font-medium">Default color</h2>
            <p className={`mt-1 ${muted}`}>
              Used by the right-click menu and shown first in the palette.
            </p>
            <RadioList
              label="Default color"
              isLabelHidden
              value={value.defaultColor}
              isDisabled={saving}
              onChange={(color) => {
                if (isHighlightColor(color))
                  void update({ defaultColor: color })
              }}
              className="mt-4">
              {HIGHLIGHT_COLORS.map((color) => (
                <RadioListItem
                  key={color}
                  value={color}
                  label={COLOR_LABELS[color]}
                  endContent={
                    <span
                      aria-hidden="true"
                      className="h-5 w-5 rounded-full"
                      style={{ backgroundColor: COLOR_VALUES[color] }}
                    />
                  }
                />
              ))}
            </RadioList>
          </fieldset>

          <fieldset className={section} disabled={saving}>
            <legend className="sr-only">Popup position</legend>
            <h2 className="font-medium">Popup position</h2>
            <p className={`mt-1 ${muted}`}>
              Near the end of your selection. Flips to the other side when space
              is tight.
            </p>
            <RadioList
              label="Popup position"
              isLabelHidden
              value={value.popupPosition}
              isDisabled={saving}
              onChange={(popupPosition) => {
                if (popupPosition === "above" || popupPosition === "below")
                  void update({ popupPosition })
              }}
              className="mt-4">
              {(["above", "below"] as const).map((position) => {
                const Icon = position === "above" ? ArrowUp : ArrowDown
                return (
                  <RadioListItem
                    key={position}
                    value={position}
                    label={
                      position === "above"
                        ? "Above selection"
                        : "Below selection"
                    }
                    endContent={<Icon size={16} aria-hidden="true" />}
                  />
                )
              })}
            </RadioList>
          </fieldset>
          <p role="status" className="text-xs text-gray-500 dark:text-gray-400">
            {saving
              ? "Saving…"
              : "Changes save automatically and apply to open pages."}
          </p>
        </>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </main>
  )
}

export default function App() {
  return (
    <AstryxTheme theme={neutralTheme} mode="system">
      <SelectionSettings />
    </AstryxTheme>
  )
}
