import componentStyles from "@astryxdesign/core/astryx.css?inline"
import resetStyles from "@astryxdesign/core/reset.css?inline"
import themeStyles from "@astryxdesign/theme-neutral/theme.css?inline"
import { createRef } from "react"
import { flushSync } from "react-dom"
import { createRoot } from "react-dom/client"

import type { HighlightColor } from "./colors"
import type { SelectionPreferences } from "./preferences"
import { ShadowTheme } from "./shadow-theme"
import { ToolbarPanel, type ToolbarHandle } from "./toolbar-panel"
import styles from "./toolbar.css?inline"

export type ToolbarRect = Pick<DOMRect, "left" | "right" | "top" | "bottom">

function mountToolbar(
  onColor: (color: HighlightColor) => void,
  onRemove: () => void,
  onDestination: () => void
) {
  const host = document.createElement("shelf-highlight-toolbar")
  host.style.cssText =
    "all:initial;position:fixed;inset:0 auto auto 0;width:0;height:0;z-index:2147483647;pointer-events:none;"
  const shadow = host.attachShadow({ mode: "open" })
  const stylesheet = document.createElement("style")
  stylesheet.textContent = [
    resetStyles,
    componentStyles.replaceAll(":root", ":host"),
    themeStyles,
    styles
  ].join("\n")
  const container = document.createElement("div")
  shadow.append(stylesheet, container)
  for (const type of ["pointerdown", "mousedown"])
    shadow.addEventListener(type, (event) => {
      if (!(event.target instanceof HTMLInputElement)) event.preventDefault()
    })
  document.documentElement.append(host)
  const root = createRoot(container)
  const toolbar = createRef<ToolbarHandle>()
  flushSync(() =>
    root.render(
      <ShadowTheme>
        <ToolbarPanel
          ref={toolbar}
          onColor={onColor}
          onRemove={onRemove}
          onDestination={onDestination}
        />
      </ShadowTheme>
    )
  )
  return { host, shadow, root, toolbar }
}

/**
 * The floating panel, built the first time it has to appear so pages where
 * nothing is ever selected don't pay for it.
 */
export function createToolbarView(
  onColor: (color: HighlightColor) => void,
  onRemove: () => void,
  onDestination: () => void
) {
  let mounted: ReturnType<typeof mountToolbar> | null = null
  let preferences: SelectionPreferences | undefined
  const panel = () => mounted?.toolbar.current
  const mount = () => {
    if (!mounted) {
      mounted = mountToolbar(onColor, onRemove, onDestination)
      if (preferences) panel()?.setPreferences(preferences)
    }
    return panel()
  }
  return {
    setPreferences(value: SelectionPreferences) {
      preferences = value
      panel()?.setPreferences(value)
    },
    show: (...args: Parameters<ToolbarHandle["show"]>) =>
      mount()?.show(...args),
    hide: () => panel()?.hide(),
    setBusy: (value: boolean) => panel()?.setBusy(value),
    showError: (message: string) => mount()?.showError(message),
    showStatus: (message: string) => mount()?.showStatus(message),
    isChoosingDestination: () => panel()?.isChoosingDestination() ?? false,
    destinationId: () => panel()?.destinationId(),
    destinationPath: () => panel()?.destinationPath() ?? "Choose folder",
    isOwnEvent: (event: Event) =>
      !!mounted && event.composedPath().includes(mounted.host),
    isOwnNode: (node: Node) =>
      !!mounted &&
      (node === mounted.host || node.getRootNode() === mounted.shadow),
    destroy() {
      mounted?.root.unmount()
      mounted?.host.remove()
      mounted = null
    }
  }
}
