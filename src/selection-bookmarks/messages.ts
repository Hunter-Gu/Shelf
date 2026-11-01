import { isHighlightColor, type HighlightColor } from "./colors"
import type { BookmarkDestination } from "./destinations"

export const GET_HIGHLIGHTS = "selection-bookmarks/get-highlights"
export const REFRESH_HIGHLIGHTS = "selection-bookmarks/refresh"
export const SAVE_HIGHLIGHT = "selection-bookmarks/save"
export const RECOLOR_HIGHLIGHT = "selection-bookmarks/recolor"
export const MOVE_HIGHLIGHT = "selection-bookmarks/move"
export const REMOVE_HIGHLIGHT = "selection-bookmarks/remove"
export const GET_DESTINATIONS = "selection-bookmarks/get-destinations"
export type DestinationsResult =
  | { ok: true; folders: BookmarkDestination[]; destinationId?: string }
  | { ok: false; error: string }

export type SavedHighlight = {
  id: string
  color: HighlightColor
  directives: string[]
  fragment: string
}

export type PageHighlights = {
  page: string | null
  highlights: SavedHighlight[]
}

export type HighlightMutation =
  | {
      type: typeof SAVE_HIGHLIGHT
      text: string
      title: string
      folderId: string
      color: HighlightColor
    }
  | { type: typeof RECOLOR_HIGHLIGHT; id: string; color: HighlightColor }
  | { type: typeof MOVE_HIGHLIGHT; id: string; title: string; folderId: string }
  | { type: typeof REMOVE_HIGHLIGHT; id: string }

export type MutationResult =
  { ok: true; highlight?: SavedHighlight } | { ok: false; error: string }

const isText = (value: unknown) => typeof value === "string" && !!value.trim()

export function isHighlightMutation(
  value: unknown
): value is HighlightMutation {
  if (!value || typeof value !== "object" || !("type" in value)) return false
  const message = value as Record<string, unknown>
  switch (message.type) {
    case SAVE_HIGHLIGHT:
      return (
        isText(message.text) &&
        typeof message.title === "string" &&
        isText(message.folderId) &&
        isHighlightColor(message.color)
      )
    case RECOLOR_HIGHLIGHT:
      return isText(message.id) && isHighlightColor(message.color)
    case MOVE_HIGHLIGHT:
      return (
        isText(message.id) &&
        typeof message.title === "string" &&
        isText(message.folderId)
      )
    case REMOVE_HIGHLIGHT:
      return isText(message.id)
    default:
      return false
  }
}
