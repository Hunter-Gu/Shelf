import {
  isFolder,
  toBaseFolder,
  type Folder,
  type RootTree
} from "~/bookmark-model"
import { LEGACY_SPECIAL_TITLES } from "~/pin-model/pin-folder"
import { parseShelfTitle } from "~/shelf-title"

const LEGACY_WORKSPACE_PATTERN = /^(.*?)\s*\((Home )?Workspace\)\s*$/

// Older versions marked workspaces "(Workspace)" / "(Home Workspace)" and
// pins/favorites "Pins (Shelf)" / "Favorites (Shelf)". Each is renamed once to
// the "(Shelf…)" format, which is the only one read anywhere else.
export function legacyTitleRenames(tree: RootTree) {
  const { bookmarksBar, otherBookmarks } = toBaseFolder(tree)
  const specialByLegacy = new Map(
    Object.entries(LEGACY_SPECIAL_TITLES).map(([title, legacy]) => [
      legacy,
      title
    ])
  )
  const renames: { id: string; title: string }[] = []

  for (const root of [bookmarksBar, otherBookmarks]) {
    for (const item of root.children ?? []) {
      if (!isFolder(item)) continue

      const special =
        root === otherBookmarks ? specialByLegacy.get(item.title) : undefined
      if (special) {
        renames.push({ id: item.id, title: special })
        continue
      }

      const match = LEGACY_WORKSPACE_PATTERN.exec(item.title)
      if (!match || parseShelfTitle(item.title)) continue
      renames.push({
        id: item.id,
        title: `${match[1].trim()} (Shelf${match[2] ? "|Home" : ""})`
      })
    }
  }

  return renames
}

// Returns the tree as it reads after the renames, so callers deciding which
// workspaces exist don't have to wait for the change events to come back.
export async function renameLegacyTitles(
  tree: RootTree,
  changeBookmark: (id: string, details: { title: string }) => Promise<unknown>
): Promise<RootTree> {
  const renamed = new Map<string, string>()

  for (const { id, title } of legacyTitleRenames(tree)) {
    await changeBookmark(id, { title })
      .then(() => renamed.set(id, title))
      .catch((error: unknown) => {
        console.error("Failed to rename a folder to the Shelf format", error)
      })
  }

  if (!renamed.size) return tree

  const withRenames = (root: Folder): Folder => ({
    ...root,
    children: root.children?.map((item) => {
      const title = renamed.get(item.id)
      return title ? { ...item, title } : item
    })
  })
  const [bookmarksBar, otherBookmarks] = tree.children

  return {
    ...tree,
    children: [withRenames(bookmarksBar), withRenames(otherBookmarks)]
  }
}
