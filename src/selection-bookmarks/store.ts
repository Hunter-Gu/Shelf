import { COLOR_LABELS, type HighlightColor } from "./colors"
import {
  bookmarkDestinations,
  matchingPageBookmarks,
  pageDestinations
} from "./destinations"
import {
  highlightFolders,
  HIGHLIGHTS_FOLDER_TITLE,
  type BookmarkNode
} from "./folder"
import {
  highlightRecords,
  pageHighlights,
  type HighlightRecord
} from "./highlight-records"
import type { SavedHighlight } from "./messages"
import { highlightDirectives, pageAddress } from "./page-url"
import { savePageBookmark } from "./save-page"
import { selectionBookmark } from "./selection-bookmark"

type BookmarksApi = {
  getTree(): Promise<BookmarkNode[]>
  getSubTree(id: string): Promise<BookmarkNode[]>
  create(details: {
    parentId: string
    title: string
    url?: string
  }): Promise<BookmarkNode>
  move(id: string, destination: { parentId: string }): Promise<BookmarkNode>
  remove(id: string): Promise<void>
}

function descendants(node: BookmarkNode): BookmarkNode[] {
  return node.url ? [node] : (node.children ?? []).flatMap(descendants)
}

export class HighlightStore {
  private folders: Promise<string[]> | null = null

  constructor(private readonly api: BookmarksApi) {}

  invalidate() {
    this.folders = null
  }

  private async loadFolders(): Promise<BookmarkNode[]> {
    this.folders ??= this.api
      .getTree()
      .then(([tree]) =>
        tree ? highlightFolders(tree).map((folder) => folder.id) : []
      )
      .catch((error: unknown) => {
        this.invalidate()
        throw error
      })
    const ids = await this.folders
    const folders = await Promise.all(
      ids.map((id) =>
        this.api.getSubTree(id).catch(() => {
          this.invalidate()
          return []
        })
      )
    )
    return folders.flat()
  }

  async forPage(pageUrl: string): Promise<SavedHighlight[]> {
    if (!pageAddress(pageUrl)) return []
    return pageHighlights(await this.loadFolders(), pageUrl)
  }

  async destinations(pageUrl: string, workspaceId: string) {
    const [tree] = await this.api.getTree()
    if (!tree) throw new Error("Chrome's bookmarks aren't available.")
    return pageDestinations(tree, pageUrl, workspaceId)
  }

  private async colorFolder(root: BookmarkNode, color: HighlightColor) {
    const title = COLOR_LABELS[color]
    const existing = root.children?.find(
      (child) => !child.url && !child.unmodifiable && child.title === title
    )
    return existing ?? this.api.create({ parentId: root.id, title })
  }

  // Synced copies of one passage are handled as a single highlight.
  private async matchingRecords(
    pageUrl: string,
    id: string
  ): Promise<HighlightRecord[]> {
    const records = highlightRecords(await this.loadFolders())
    const selected = records.find(
      ({ bookmark }) =>
        bookmark.id === id &&
        bookmark.url &&
        highlightDirectives(bookmark.url, pageUrl).length
    )
    if (!selected)
      throw new Error(
        "This highlight is no longer available. Reload the page and try again."
      )
    return records.filter(
      ({ bookmark }) => bookmark.url === selected.bookmark.url
    )
  }

  async recolor(pageUrl: string, id: string, color: HighlightColor) {
    const records = await this.matchingRecords(pageUrl, id)
    const folder = await this.colorFolder(records[0].root, color)
    for (const { bookmark } of records) {
      if (bookmark.parentId !== folder.id)
        await this.api.move(bookmark.id, { parentId: folder.id })
    }
    this.invalidate()
  }

  /** Moves the page a highlight belongs to into another folder. */
  async move(
    pageUrl: string,
    id: string,
    destination: { folderId: string; pageTitle: string }
  ) {
    const records = await this.matchingRecords(pageUrl, id)
    const [tree] = await this.api.getTree()
    if (!tree) throw new Error("Chrome's bookmarks aren't available.")
    const folder = bookmarkDestinations(tree).find(
      (item) => item.id === destination.folderId
    )
    if (!folder)
      throw new Error(
        "This folder is no longer available. Choose another save location."
      )
    await savePageBookmark(this.api, tree, {
      pageUrl,
      pageTitle:
        matchingPageBookmarks(tree, pageUrl)[0]?.title ?? destination.pageTitle,
      parentId: folder.id,
      passageUrls: records.flatMap(({ bookmark }) =>
        bookmark.url ? [bookmark.url] : []
      )
    })
    this.invalidate()
  }

  async remove(pageUrl: string, id: string) {
    const records = await this.matchingRecords(pageUrl, id)
    for (const { bookmark } of records) await this.api.remove(bookmark.id)
    this.invalidate()
  }

  async save(input: {
    text: string
    pageUrl: string
    pageTitle: string
    folderId: string
    color: HighlightColor
  }): Promise<boolean> {
    const selection = selectionBookmark(input.text, input.pageUrl)
    if (!selection) return false

    const [tree] = await this.api.getTree()
    if (!tree) throw new Error("Chrome's bookmarks aren't available.")
    const destination = bookmarkDestinations(tree).find(
      (folder) => folder.id === input.folderId
    )
    if (!destination)
      throw new Error(
        "This folder is no longer available. Choose another save location."
      )

    const folders = highlightFolders(tree)
    const savedPassages = folders.flatMap(descendants)
    const passageUrls = [
      selection.url,
      ...savedPassages.flatMap((node) => (node.url ? [node.url] : []))
    ]
    await savePageBookmark(this.api, tree, {
      pageUrl: input.pageUrl,
      pageTitle: input.pageTitle,
      parentId: destination.id,
      passageUrls
    })

    const existing = savedPassages.find((node) => node.url === selection.url)
    if (existing) {
      await this.recolor(input.pageUrl, existing.id, input.color)
      return true
    }

    let folder = folders.find((node) => !node.unmodifiable)
    if (!folder) {
      const otherBookmarks = tree.children?.[1]
      if (!otherBookmarks) throw new Error("Other Bookmarks isn't available.")
      folder = await this.api.create({
        parentId: otherBookmarks.id,
        title: HIGHLIGHTS_FOLDER_TITLE
      })
    }
    const colorFolder = await this.colorFolder(folder, input.color)
    await this.api.create({ ...selection, parentId: colorFolder.id })
    this.invalidate()
    return true
  }
}
