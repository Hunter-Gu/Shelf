type TabLike = { id?: number; windowId: number; url?: string }

function sameAddress(url: string | undefined) {
  if (!url) return ""
  try {
    return new URL(url).href
  } catch {
    return url
  }
}

/** A tab already showing this address, preferring one in the given window. */
export function findOpenTab<T extends TabLike>(
  tabs: T[],
  url: string,
  windowId: number | undefined
): T | undefined {
  const wanted = sameAddress(url)
  const matches = tabs.filter(
    (tab) => tab.id !== undefined && sameAddress(tab.url) === wanted
  )
  return matches.find((tab) => tab.windowId === windowId) ?? matches[0]
}
