import {
  FAVORITES_FOLDER_TITLE,
  LEGACY_SPECIAL_TITLES
} from "~/pin-model/pin-folder"
import { formatShelfTitle, parseShelfTitle } from "~/shelf-title"

import type { ArcLink, ArcNode, ArcSidebar } from "./parse-arc-sidebar"

export type BookmarkNode = {
  id: string
  title: string
  url?: string
  children?: BookmarkNode[]
}

export type BookmarksApi = {
  getTree(): Promise<BookmarkNode[]>
  create(details: {
    parentId: string
    title: string
    url?: string
  }): Promise<{ id: string }>
}

export type ArcImportChoice = {
  spaceIds: string[]
  /** Profiles whose favorites go into Shelf's favorites. */
  favoriteProfiles: string[]
  /** Whether the chosen spaces' open Today tabs come along too. */
  today: boolean
}

export const ARC_TODAY_FOLDER = "Arc Today"

export type ArcImportResult = {
  spaces: number
  added: number
  skipped: number
  failed: number
}

// Chrome stores a bookmark's address in normalized form ("https://x.com"
// comes back as "https://x.com/"), so Arc's addresses are compared the same way.
function sameUrl(url: string) {
  try {
    return new URL(url).href
  } catch {
    return url
  }
}

function urlsUnder(node: BookmarkNode, urls = new Set<string>()) {
  if (node.url) urls.add(sameUrl(node.url))
  node.children?.forEach((child) => urlsUnder(child, urls))
  return urls
}

// Shelf's Home starts out named "Home", so an Arc space of that name would
// read as a second Home in the dock.
function spaceName(title: string) {
  return title.trim().toLowerCase() === "home" ? `${title.trim()} (Arc)` : title
}

/**
 * Writes the chosen Arc spaces into Chrome bookmarks as Shelf spaces, the
 * chosen profiles' favorites into Shelf's favorites, and the spaces' open
 * Today tabs into an "Arc Today" folder in Home, one subfolder per space.
 * Importing again adds only what is missing: a space or folder whose name
 * already exists is filled in rather than duplicated, and a link already in
 * it is skipped.
 */
export async function importArcSidebar(
  sidebar: ArcSidebar,
  choice: ArcImportChoice,
  api: BookmarksApi
): Promise<ArcImportResult> {
  const [root] = await api.getTree()
  const [bookmarksBar, otherBookmarks] = root?.children ?? []
  if (!bookmarksBar || !otherBookmarks) {
    throw new Error("Chrome's bookmarks aren't available.")
  }
  const result: ArcImportResult = { spaces: 0, added: 0, skipped: 0, failed: 0 }

  const create = async (parentId: string, title: string, url?: string) => {
    try {
      const created = await api.create({ parentId, title, url })
      if (url) result.added += 1
      return created.id
    } catch (error) {
      console.error("Failed to import an Arc item", error)
      result.failed += 1
      return null
    }
  }

  const writeLinks = async (
    parent: BookmarkNode,
    nodes: ArcNode[],
    present: Set<string>
  ) => {
    for (const node of nodes) {
      if (node.kind === "link") {
        if (present.has(sameUrl(node.url))) {
          result.skipped += 1
          continue
        }
        if (await create(parent.id, node.title, node.url))
          present.add(sameUrl(node.url))
        continue
      }

      const existing = parent.children?.find(
        (child) => !child.url && child.title === node.title
      )
      const folderId = existing?.id ?? (await create(parent.id, node.title))
      if (!folderId) continue
      await writeLinks(
        existing ?? { id: folderId, title: node.title, children: [] },
        node.children,
        present
      )
    }
  }

  // An existing child folder of that title, or a new one.
  const folderIn = async (
    parent: BookmarkNode,
    title: string,
    matches = (child: BookmarkNode) => child.title === title
  ): Promise<BookmarkNode | null> => {
    const existing = parent.children?.find(
      (child) => !child.url && matches(child)
    )
    if (existing) return existing
    const id = await create(parent.id, title)
    if (!id) return null
    const created = { id, title, children: [] }
    parent.children = [...(parent.children ?? []), created]
    return created
  }

  const topFolders = [bookmarksBar, otherBookmarks].flatMap(
    (base) => base.children?.filter((child) => !child.url) ?? []
  )
  const chosen = sidebar.spaces.filter((space) =>
    choice.spaceIds.includes(space.id)
  )

  for (const space of chosen) {
    if (!space.items.length) continue

    // A space of the same name may sit in either root, under any emoji.
    const name = spaceName(space.title)
    const folder =
      topFolders.find((candidate) => {
        const parsed = parseShelfTitle(candidate.title)
        return (
          !!parsed &&
          parsed.role === undefined &&
          parsed.name.toLowerCase() === name.toLowerCase()
        )
      }) ??
      (await folderIn(
        bookmarksBar,
        formatShelfTitle(name, { logo: space.emoji }),
        () => false
      ))
    if (!folder) continue

    await writeLinks(folder, space.items, urlsUnder(folder))
    result.spaces += 1
  }

  const favorites = sidebar.profiles
    .filter((profile) => choice.favoriteProfiles.includes(profile.key))
    .flatMap((profile) => profile.favorites)
  if (favorites.length) {
    const folder = await folderIn(
      otherBookmarks,
      FAVORITES_FOLDER_TITLE,
      (child) =>
        child.title === FAVORITES_FOLDER_TITLE ||
        child.title === LEGACY_SPECIAL_TITLES[FAVORITES_FOLDER_TITLE]
    )
    if (folder) await writeLinks(folder, favorites, urlsUnder(folder))
  }

  const today = choice.today ? chosen.filter((space) => space.today.length) : []
  if (today.length) {
    // Home shows its own folder once it has one, and the Bookmarks Bar
    // until then.
    const home =
      topFolders.find(
        (folder) => parseShelfTitle(folder.title)?.role === "Home"
      ) ?? bookmarksBar
    const todayFolder = await folderIn(home, ARC_TODAY_FOLDER)
    for (const space of todayFolder ? today : []) {
      const folder = await folderIn(todayFolder!, space.title)
      if (folder) await writeLinks(folder, space.today, urlsUnder(folder))
    }
  }

  return result
}
