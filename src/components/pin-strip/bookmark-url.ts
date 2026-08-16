export function normalizeBookmarkUrl(value: string | undefined) {
  if (!value) return ""

  try {
    return new URL(value).href
  } catch {
    return value
  }
}
