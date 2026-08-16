import type { BookmarkDropEdge } from "./bookmark-drop"

export function bookmarkDropClass(
  isOver: boolean,
  edge: BookmarkDropEdge | undefined,
  _axis: "horizontal" | "vertical" = "vertical"
) {
  if (!isOver) return ""
  if (edge === "inside") {
    return "bg-black/10 ring-1 ring-black/15 dark:bg-white/10 dark:ring-white/20"
  }

  // Before/after placement is represented by a structural landing slot. A
  // second line indicator would compete with the stronger spatial cue.
  return ""
}
