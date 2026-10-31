import type { ContentScriptContext } from "wxt/utils/content-script-context"

import type { HighlightColor } from "./colors"
import {
  MOVE_HIGHLIGHT,
  RECOLOR_HIGHLIGHT,
  REMOVE_HIGHLIGHT,
  SAVE_HIGHLIGHT,
  type HighlightMutation
} from "./messages"
import { pageAddress } from "./page-url"
import { highlightAtPoint, type PaintedHighlight } from "./paint-highlights"
import type { SelectionPreferences } from "./preferences"
import { selectionBookmark } from "./selection-bookmark"
import { editable, selectionRect } from "./selection-dom"
import { sendHighlightMutation } from "./send-mutation"
import { createToolbarView } from "./toolbar-view"

type Target =
  | { kind: "selection"; text: string; title: string; url: string }
  | {
      kind: "highlight"
      id: string
      url: string
      color: HighlightColor
      selectedText?: string
    }

type Action =
  | { kind: "color"; color: HighlightColor }
  | { kind: "move" }
  | { kind: "remove" }

function mutationFor(
  target: Target,
  action: Action,
  folderId: string | undefined
): HighlightMutation | null {
  if (target.kind === "selection")
    return action.kind === "color" && folderId
      ? {
          type: SAVE_HIGHLIGHT,
          text: target.text,
          title: target.title,
          folderId,
          color: action.color
        }
      : null
  if (action.kind === "color")
    return { type: RECOLOR_HIGHLIGHT, id: target.id, color: action.color }
  if (action.kind === "remove") return { type: REMOVE_HIGHLIGHT, id: target.id }
  return folderId
    ? { type: MOVE_HIGHLIGHT, id: target.id, title: document.title, folderId }
    : null
}

const STATUS: Record<HighlightMutation["type"], (path: string) => string> = {
  [SAVE_HIGHLIGHT]: (path) => `Saved to ${path}`,
  [RECOLOR_HIGHLIGHT]: () => "Updated",
  [MOVE_HIGHLIGHT]: (path) => `Moved to ${path}`,
  [REMOVE_HIGHLIGHT]: () => "Removed"
}

export function installHighlightToolbar(
  ctx: ContentScriptContext,
  getPainted: () => PaintedHighlight[],
  refresh: () => Promise<void>
) {
  let target: Target | null = null
  let selecting = false
  let toolbarPointer = false
  let pending: ReturnType<typeof setTimeout> | undefined
  let statusTimer: ReturnType<typeof setTimeout> | undefined
  let busy = false
  let failed = false
  let enabled = true
  const reset = () => {
    clearTimeout(pending)
    clearTimeout(statusTimer)
    target = null
    failed = false
    view.hide()
    view.setBusy(false)
  }
  const close = () => {
    if (!busy) reset()
  }
  const mutate = async (action: Action) => {
    if (busy) return
    const active = target
    if (!active || pageAddress(active.url) !== pageAddress(location.href)) {
      failed = true
      view.showError(
        "The selection is no longer available. Select the text again."
      )
      return
    }
    const folderId = view.destinationId()
    const needsFolder = action.kind === "move" || active.kind === "selection"
    if (needsFolder && !folderId) {
      view.showError("Choose a save location first.")
      return
    }
    const destinationPath = view.destinationPath()
    const message = mutationFor(active, action, folderId)
    if (!message) return
    busy = true
    failed = false
    clearTimeout(pending)
    view.setBusy(true)
    try {
      await sendHighlightMutation(message)
      busy = false
      if (target === active) {
        if (active.kind === "selection" || active.selectedText !== undefined)
          window.getSelection()?.removeAllRanges()
        target = null
        view.setBusy(false)
        view.showStatus(STATUS[message.type](destinationPath))
        statusTimer = setTimeout(() => {
          if (target === null) close()
        }, 1200)
      }
      await refresh()
    } catch (error) {
      busy = false
      console.error("Shelf highlight operation failed", error)
      if (target === active) {
        failed = true
        view.setBusy(false)
        view.showError(
          error instanceof Error
            ? error.message
            : "Could not update this highlight. Try again."
        )
      }
    }
  }
  const view = createToolbarView(
    (color) => void mutate({ kind: "color", color }),
    () => void mutate({ kind: "remove" }),
    () => {
      if (target?.kind === "highlight") void mutate({ kind: "move" })
    }
  )

  const updateSelection = () => {
    if (
      !enabled ||
      view.isChoosingDestination() ||
      (document.activeElement && view.isOwnNode(document.activeElement)) ||
      selecting ||
      busy ||
      failed
    )
      return
    const selection = window.getSelection()
    if (
      !selection ||
      selection.isCollapsed ||
      !selection.rangeCount ||
      !selection.toString().trim()
    ) {
      if (target?.kind === "selection") close()
      return
    }
    if (
      (selection.anchorNode && view.isOwnNode(selection.anchorNode)) ||
      (selection.focusNode && view.isOwnNode(selection.focusNode))
    )
      return
    if (
      editable(selection.anchorNode) ||
      editable(selection.focusNode) ||
      editable(document.activeElement)
    )
      return close()
    const rect = selectionRect(selection)
    if (rect.bottom <= 0 || rect.top >= window.innerHeight) return close()
    const text = selection.toString().trim()
    const sameSelection =
      target?.url === location.href &&
      (target.kind === "selection" ? target.text : target.selectedText) === text
    if (!sameSelection) {
      const saved = selectionBookmark(text, location.href)
      const fragment = saved ? new URL(saved.url).hash.split(":~:")[0] : ""
      const existing = getPainted().find(
        ({ highlight }) => highlight.fragment === fragment
      )?.highlight
      target = existing
        ? {
            kind: "highlight",
            id: existing.id,
            color: existing.color,
            url: location.href,
            selectedText: text
          }
        : {
            kind: "selection",
            text,
            title: document.title,
            url: location.href
          }
    }
    view.setBusy(false)
    view.show(
      rect,
      target?.kind === "highlight" ? target.color : undefined,
      !sameSelection
    )
  }
  const scheduleSelection = () => {
    if (busy || failed) return
    clearTimeout(pending)
    pending = setTimeout(updateSelection, 150)
  }
  ctx.addEventListener(document, "selectionchange", scheduleSelection)
  ctx.addEventListener(
    document,
    "pointerdown",
    (event) => {
      toolbarPointer = view.isOwnEvent(event)
      if (toolbarPointer) return
      selecting = true
      close()
    },
    { capture: true }
  )
  ctx.addEventListener(document, "pointerup", (event) => {
    selecting = false
    if (event.button === 0 && !view.isOwnEvent(event)) scheduleSelection()
  })
  ctx.addEventListener(document, "contextmenu", close)
  ctx.addEventListener(document, "pointercancel", () => {
    toolbarPointer = false
    selecting = false
    close()
  })
  ctx.addEventListener(
    document,
    "click",
    (event) => {
      const fromToolbar = toolbarPointer
      toolbarPointer = false
      // Saving can resize the toolbar before pointerup retargets the click.
      if (fromToolbar && !view.isOwnEvent(event)) {
        event.preventDefault()
        event.stopPropagation()
        return
      }
      if (
        !enabled ||
        busy ||
        view.isOwnEvent(event) ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        editable(event.target as Node)
      )
        return
      const selection = window.getSelection()
      if (selection && !selection.isCollapsed) return
      const item = highlightAtPoint(getPainted(), event.clientX, event.clientY)
      if (!item) return
      event.preventDefault()
      event.stopPropagation()
      target = {
        kind: "highlight",
        id: item.highlight.id,
        color: item.highlight.color,
        url: location.href
      }
      const rect = item.ranges
        .flatMap((range) => Array.from(range.getClientRects()))
        .find(
          (rect) => event.clientY >= rect.top && event.clientY <= rect.bottom
        )
      view.show(
        {
          left: event.clientX,
          right: event.clientX,
          top: rect?.top ?? event.clientY,
          bottom: rect?.bottom ?? event.clientY
        },
        item.highlight.color,
        true
      )
    },
    { capture: true }
  )
  ctx.addEventListener(document, "keydown", (event) => {
    if (event.key === "Escape") close()
  })
  ctx.addEventListener(
    document,
    "scroll",
    (event) => {
      if (!view.isOwnEvent(event)) close()
    },
    {
      capture: true,
      passive: true
    }
  )
  ctx.addEventListener(window, "resize", close)
  ctx.addEventListener(window, "blur", () => {
    selecting = false
    close()
  })
  ctx.onInvalidated(() => {
    busy = false
    reset()
    view.destroy()
  })
  return {
    close,
    setPreferences(value: SelectionPreferences) {
      enabled = value.enabled
      view.setPreferences(value)
      if (!enabled) close()
    }
  }
}
