import { folderColor, type HighlightColor } from "./colors"
import type { BookmarkNode } from "./folder"
import type { SavedHighlight } from "./messages"
import { highlightDirectives } from "./page-url"

export type HighlightRecord = {
  bookmark: BookmarkNode
  root: BookmarkNode
  color: HighlightColor
}

// Each color is a subfolder of Highlights named after it.
export function highlightRecords(roots: BookmarkNode[]): HighlightRecord[] {
  const walk = (
    node: BookmarkNode,
    root: BookmarkNode,
    color: HighlightColor
  ): HighlightRecord[] => {
    if (node.url) return [{ bookmark: node, root, color }]
    return (node.children ?? []).flatMap((child) =>
      walk(child, root, child.url ? color : (folderColor(child.title) ?? color))
    )
  }
  return roots.flatMap((root) => walk(root, root, "yellow"))
}

export function pageHighlights(
  roots: BookmarkNode[],
  pageUrl: string
): SavedHighlight[] {
  const seen = new Set<string>()
  return highlightRecords(roots).flatMap(({ bookmark, color }) => {
    if (!bookmark.url || seen.has(bookmark.url)) return []
    const directives = highlightDirectives(bookmark.url, pageUrl)
    if (!directives.length) return []
    seen.add(bookmark.url)
    return [
      {
        id: bookmark.id,
        color,
        directives,
        fragment: new URL(bookmark.url).hash.split(":~:")[0]
      }
    ]
  })
}
