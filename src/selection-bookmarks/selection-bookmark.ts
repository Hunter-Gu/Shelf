import { passageUrl } from "~/bookmark-model/passage-url"

export function selectionBookmark(selectionText: string, pageUrl: string) {
  const title = selectionText.trim().replace(/\s+/g, " ")
  if (!title) return null

  try {
    const page = new URL(pageUrl)
    if (page.protocol !== "http:" && page.protocol !== "https:") return null
    return { title, url: passageUrl(title, page.href) }
  } catch {
    return null
  }
}
