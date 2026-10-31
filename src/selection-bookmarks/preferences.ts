import { isHighlightColor, type HighlightColor } from "./colors"

export type PopupPosition = "above" | "below"
export type SelectionPreferences = {
  enabled: boolean
  defaultColor: HighlightColor
  popupPosition: PopupPosition
}

export const DEFAULT_SELECTION_PREFERENCES: SelectionPreferences = {
  enabled: true,
  defaultColor: "yellow",
  popupPosition: "above"
}

export function selectionPreferences(value: unknown): SelectionPreferences {
  const stored = (value && typeof value === "object" ? value : {}) as Record<
    string,
    unknown
  >
  return {
    enabled:
      typeof stored.enabled === "boolean"
        ? stored.enabled
        : DEFAULT_SELECTION_PREFERENCES.enabled,
    defaultColor: isHighlightColor(stored.defaultColor)
      ? stored.defaultColor
      : DEFAULT_SELECTION_PREFERENCES.defaultColor,
    popupPosition: stored.popupPosition === "below" ? "below" : "above"
  }
}
