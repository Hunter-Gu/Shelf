import {
  parseFragmentDirectives,
  processTextFragmentDirective
} from "text-fragments-polyfill/text-fragment-utils"

import { HIGHLIGHT_COLORS } from "./colors"
import type { SavedHighlight } from "./messages"

const HIGHLIGHT_NAME = "shelf-saved-passages"
let nativeFragment: string | null = null

export type PaintedHighlight = { highlight: SavedHighlight; ranges: Range[] }

export function clearHighlights(resetNative = true) {
  for (const color of HIGHLIGHT_COLORS)
    CSS.highlights?.delete(`${HIGHLIGHT_NAME}-${color}`)
  if (resetNative) {
    nativeFragment = null
    document.documentElement.removeAttribute("data-shelf-native-highlight")
  }
}

export function paintHighlights(
  highlights: SavedHighlight[]
): PaintedHighlight[] {
  if (!CSS.highlights || !document.body) return []
  const fragment = location.hash.split(":~:")[0]
  if (nativeFragment !== null && nativeFragment !== fragment) clearHighlights()
  if (
    fragment &&
    highlights.some((highlight) => highlight.fragment === fragment)
  ) {
    // Chrome's own text-fragment highlight would cover the chosen color, and
    // would stay after the passage is removed.
    nativeFragment = fragment
    document.documentElement.setAttribute("data-shelf-native-highlight", "")
  }
  const painted: PaintedHighlight[] = []
  for (const highlight of highlights) {
    const ranges: Range[] = []
    for (const directive of highlight.directives) {
      try {
        const [fragment] = parseFragmentDirectives({ text: [directive] }).text
        if (!fragment) continue
        const [range] = processTextFragmentDirective(
          fragment,
          document,
          document.body
        )
        if (range) ranges.push(range)
      } catch {
        // One stale or malformed bookmark must not hide the other passages.
      }
    }
    if (ranges.length) painted.push({ highlight, ranges })
  }
  clearHighlights(false)
  for (const color of HIGHLIGHT_COLORS) {
    const ranges = painted
      .filter((item) => item.highlight.color === color)
      .flatMap((item) => item.ranges)
    if (ranges.length)
      CSS.highlights.set(`${HIGHLIGHT_NAME}-${color}`, new Highlight(...ranges))
  }
  return painted
}

export function highlightAtPoint(
  painted: PaintedHighlight[],
  x: number,
  y: number
) {
  // Colors later in the list are painted on top, so they win where passages overlap.
  return [...painted]
    .sort(
      (a, b) =>
        HIGHLIGHT_COLORS.indexOf(b.highlight.color) -
        HIGHLIGHT_COLORS.indexOf(a.highlight.color)
    )
    .find((item) =>
      item.ranges.some((range) =>
        Array.from(range.getClientRects()).some(
          (rect) =>
            x >= rect.left &&
            x <= rect.right &&
            y >= rect.top &&
            y <= rect.bottom
        )
      )
    )
}
