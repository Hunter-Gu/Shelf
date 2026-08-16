import type { BookmarkDropEdge } from "./bookmark-drop"

export function bookmarkDropClass(
  isOver: boolean,
  edge: BookmarkDropEdge | undefined,
  axis: "horizontal" | "vertical" = "vertical"
) {
  if (!isOver) return ""
  if (edge === "inside") return "bg-black/10 dark:bg-white/10"
  if (axis === "horizontal" && edge === "before") {
    return "before:absolute before:inset-y-1 before:left-0 before:w-px before:bg-gray-500 before:content-['']"
  }
  if (axis === "horizontal" && edge === "after") {
    return "after:absolute after:inset-y-1 after:right-0 after:w-px after:bg-gray-500 after:content-['']"
  }
  if (edge === "before") {
    return "before:absolute before:inset-x-1 before:top-0 before:h-px before:bg-gray-500 before:content-['']"
  }
  if (edge === "after") {
    return "after:absolute after:inset-x-1 after:bottom-0 after:h-px after:bg-gray-500 after:content-['']"
  }
  return ""
}
