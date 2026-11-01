export function pageAddress(value: string): string | null {
  try {
    const url = new URL(value)
    if (url.protocol !== "http:" && url.protocol !== "https:") return null
    url.hash = ""
    return url.href
  } catch {
    return null
  }
}

export function originalPageUrl(
  value: string,
  passageUrls: readonly string[] = []
): string {
  const url = new URL(value)
  const directive = url.hash.indexOf(":~:")
  if (directive !== -1) {
    const fragment = url.hash.slice(1, directive)
    url.hash = /^p[0-9a-z]+$/.test(fragment) ? "" : fragment
  } else if (
    url.hash &&
    passageUrls.some(
      (passage) =>
        pageAddress(passage) === pageAddress(value) &&
        new URL(passage).hash.startsWith(`${url.hash}:~:text=`)
    )
  ) {
    // A page URL can retain the passage id after its text directive is stripped.
    url.hash = ""
  }
  return url.href
}

export function highlightDirectives(value: string, page: string): string[] {
  if (!pageAddress(page) || pageAddress(value) !== pageAddress(page)) return []
  const hash = new URL(value).hash
  const start = hash.indexOf(":~:")
  if (start === -1) return []
  return hash
    .slice(start + 3)
    .split("&")
    .filter((part) => part.startsWith("text=") && part.length > 5)
    .map((part) => part.slice(5))
}
