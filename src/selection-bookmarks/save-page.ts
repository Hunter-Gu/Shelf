import { matchingPageBookmarks } from "./destinations"
import type { BookmarkNode } from "./folder"
import { originalPageUrl } from "./page-url"

type PageBookmarksApi = {
  create(details: {
    parentId: string
    title: string
    url: string
  }): Promise<BookmarkNode>
  move(id: string, destination: { parentId: string }): Promise<BookmarkNode>
}

export async function savePageBookmark(
  api: PageBookmarksApi,
  tree: BookmarkNode,
  input: {
    pageUrl: string
    pageTitle: string
    parentId: string
    passageUrls: string[]
  }
) {
  const pageUrl = originalPageUrl(input.pageUrl, input.passageUrls)
  const matches = matchingPageBookmarks(tree, pageUrl)
  const existing =
    matches.find((node) => node.parentId === input.parentId) ?? matches[0]
  if (existing) {
    if (existing.parentId !== input.parentId)
      await api.move(existing.id, { parentId: input.parentId })
    return
  }
  await api.create({
    parentId: input.parentId,
    title: input.pageTitle.trim() || new URL(pageUrl).hostname,
    url: pageUrl
  })
}
