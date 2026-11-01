export const HIGHLIGHT_COLORS = ["pink", "yellow", "green", "blue"] as const
export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number]

export const COLOR_LABELS: Record<HighlightColor, string> = {
  pink: "Pink",
  yellow: "Yellow",
  green: "Green",
  blue: "Blue"
}

export const COLOR_VALUES: Record<HighlightColor, string> = {
  pink: "#ffb3c6",
  yellow: "#fff58a",
  green: "#a3f5aa",
  blue: "#b4ccff"
}

export function isHighlightColor(value: unknown): value is HighlightColor {
  return HIGHLIGHT_COLORS.some((color) => color === value)
}

export function folderColor(title: string): HighlightColor | undefined {
  return HIGHLIGHT_COLORS.find((color) => COLOR_LABELS[color] === title)
}
