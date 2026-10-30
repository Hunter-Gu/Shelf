import { parseShelfTitle } from "~/shelf-title"
import { workspaceName } from "~/workspace-model/workspace-name"

export type BookmarkNode = {
  id: string
  title: string
  url?: string
  children?: BookmarkNode[]
}

export type FolderLocation = "Bookmarks Bar" | "Other Bookmarks" | "Home"

export type FolderCandidate = {
  id: string
  parentId: string
  title: string
  location: FolderLocation
  bookmarks: number
}

export type FolderChoice = { id: string; name: string; logo: string }

export type FolderSpacesApi = {
  move(id: string, destination: { parentId: string }): Promise<unknown>
  update(id: string, changes: { title: string }): Promise<unknown>
}

function countBookmarks(node: BookmarkNode): number {
  if (node.url) return 1
  return (node.children ?? []).reduce(
    (sum, child) => sum + countBookmarks(child),
    0
  )
}

const folders = (node: BookmarkNode) =>
  node.children?.filter((child) => !child.url) ?? []

/**
 * The folders that could become spaces — plain folders at the top of either
 * root or of Home's own folder — and the names spaces already use.
 */
export function readFolders(root: BookmarkNode) {
  const [bookmarksBar, otherBookmarks] = root.children ?? []
  if (!bookmarksBar || !otherBookmarks) {
    throw new Error("Chrome's bookmarks aren't available.")
  }
  const top = [...folders(bookmarksBar), ...folders(otherBookmarks)]
  const homeFolder = top.find(
    (folder) => parseShelfTitle(folder.title)?.role === "Home"
  )

  const candidates = [
    { parent: bookmarksBar, location: "Bookmarks Bar" as const },
    { parent: otherBookmarks, location: "Other Bookmarks" as const },
    ...(homeFolder ? [{ parent: homeFolder, location: "Home" as const }] : [])
  ].flatMap(({ parent, location }) =>
    folders(parent)
      .filter((folder) => !parseShelfTitle(folder.title))
      .map((folder) => ({
        id: folder.id,
        parentId: parent.id,
        title: folder.title,
        location,
        bookmarks: countBookmarks(folder)
      }))
  )

  const takenNames = top
    .filter((folder) => workspaceName.isValid(folder.title))
    .map((folder) => workspaceName.parse(folder.title))
  if (!homeFolder) takenNames.push(workspaceName.home)

  return { bookmarksBarId: bookmarksBar.id, candidates, takenNames }
}

/** Why a chosen name can't be used, or null when it can. */
export function nameProblem(
  name: string,
  {
    takenNames,
    otherChosenNames
  }: {
    takenNames: string[]
    otherChosenNames: string[]
  }
) {
  if (!name.trim()) return "Enter a name"
  if (workspaceName.isTaken(name, takenNames))
    return `"${name.trim()}" is already a space`
  if (workspaceName.isTaken(name, otherChosenNames))
    return "Two spaces can't share a name"
  return null
}

/**
 * Turns each chosen folder into a space: it moves to the Bookmarks Bar if it
 * isn't there and takes the space's name and emoji. Shelf picks the renamed
 * folders up as spaces on its own.
 */
export async function turnFoldersIntoSpaces(
  choices: FolderChoice[],
  candidates: FolderCandidate[],
  bookmarksBarId: string,
  api: FolderSpacesApi
) {
  const result = { spaces: 0, failed: 0 }
  for (const choice of choices) {
    const folder = candidates.find((candidate) => candidate.id === choice.id)
    if (!folder) continue
    try {
      if (folder.parentId !== bookmarksBarId) {
        await api.move(folder.id, { parentId: bookmarksBarId })
      }
      await api.update(folder.id, {
        title: workspaceName.format(choice.name, choice.logo)
      })
      result.spaces += 1
    } catch (error) {
      console.error("Failed to turn a folder into a space", error)
      result.failed += 1
    }
  }
  return result
}
