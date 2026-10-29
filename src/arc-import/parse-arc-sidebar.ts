export type ArcLink = { kind: "link"; title: string; url: string }
export type ArcFolder = { kind: "folder"; title: string; children: ArcNode[] }
export type ArcNode = ArcLink | ArcFolder
export type ArcSpace = {
  id: string
  title: string
  emoji: string
  /** Key of the Arc profile the space belongs to. */
  profile: string
  /** Pinned links and folders, in Arc's order. */
  items: ArcNode[]
  /** Open, unpinned tabs — Arc's Today list for the space. */
  today: ArcLink[]
}
export type ArcProfile = { key: string; label: string; favorites: ArcLink[] }
export type ArcSidebar = { profiles: ArcProfile[]; spaces: ArcSpace[] }

type Json = Record<string, unknown>

export const DEFAULT_PROFILE = "default"

const NOT_ARC_FILE =
  "This doesn't look like Arc's StorableSidebar.json. Pick that file from Arc's folder."

function isObject(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

// Arc stores spaces and items as flat lists of [id, object, id, object, ...].
function objectsOf(list: unknown): Json[] {
  return Array.isArray(list) ? list.filter(isObject) : []
}

function isUsableUrl(url: string) {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Arc describes a profile as { default: true } or
// { custom: { _0: { directoryBasename: "Profile 1", ... } } }.
function profileKey(profile: unknown) {
  if (!isObject(profile) || profile.default) return DEFAULT_PROFILE
  const custom = isObject(profile.custom) ? profile.custom._0 : undefined
  return (isObject(custom) && text(custom.directoryBasename)) || DEFAULT_PROFILE
}

function uniqueLinks(links: ArcLink[]) {
  const urls = new Set<string>()
  return links.filter((link) => {
    if (urls.has(link.url)) return false
    urls.add(link.url)
    return true
  })
}

// The id that follows a marker such as { pinned: {} } in a space's container list.
function containerAfter(ids: unknown, marker: string) {
  if (!Array.isArray(ids)) return ""
  const index = ids.findIndex(
    (entry) => entry === marker || (isObject(entry) && marker in entry)
  )
  return index === -1 ? "" : text(ids[index + 1])
}

/**
 * Reads Arc's sidebar file into what Shelf can import: each space's pinned
 * links and folders in Arc's order, its open Today tabs, and each profile's
 * favorites. Spaces with neither pinned nor open links are left out.
 */
export function parseArcSidebar(json: unknown): ArcSidebar {
  const containers =
    isObject(json) && isObject(json.sidebar)
      ? json.sidebar.containers
      : undefined
  const container = objectsOf(containers).find(
    (candidate) =>
      Array.isArray(candidate.spaces) && Array.isArray(candidate.items)
  )
  if (!container) throw new Error(NOT_ARC_FILE)

  const items = new Map(
    objectsOf(container.items).map((item) => [text(item.id), item])
  )

  const nodesOf = (ids: unknown, seen: Set<string>): ArcNode[] =>
    (Array.isArray(ids) ? ids : []).flatMap((id) => nodeOf(text(id), seen))

  const nodeOf = (id: string, seen: Set<string>): ArcNode[] => {
    const item = items.get(id)
    if (!item || seen.has(id)) return []
    seen.add(id)
    const data = isObject(item.data) ? item.data : {}

    if (isObject(data.tab)) {
      const url = text(data.tab.savedURL)
      if (!isUsableUrl(url)) return []
      return [
        {
          kind: "link",
          title: text(item.title) || text(data.tab.savedTitle) || url,
          url
        }
      ]
    }
    if (isObject(data.list)) {
      const children = nodesOf(item.childrenIds, seen)
      // A folder with no link anywhere inside has nothing to bring over.
      if (!countLinks(children)) return []
      return [
        { kind: "folder", title: text(item.title) || "Untitled", children }
      ]
    }
    // Split views and other groupings keep their tabs; their links move up
    // to where the grouping was.
    return nodesOf(item.childrenIds, seen)
  }

  const linksIn = (containerId: string) => {
    const holder = items.get(containerId)
    return holder ? nodesOf(holder.childrenIds, new Set([containerId])) : []
  }

  const spaces = objectsOf(container.spaces).flatMap((space, index) => {
    const pinnedId =
      containerAfter(space.newContainerIDs, "pinned") ||
      containerAfter(space.containerIDs, "pinned")
    const todayId =
      containerAfter(space.newContainerIDs, "unpinned") ||
      containerAfter(space.containerIDs, "unpinned")
    const pinned = linksIn(pinnedId)
    const today = uniqueLinks(linksIn(todayId).flatMap(flattenLinks))
    if (!pinned.length && !today.length) return []

    const customInfo = isObject(space.customInfo) ? space.customInfo : {}
    const iconType = isObject(customInfo.iconType) ? customInfo.iconType : {}
    return [
      {
        id: text(space.id) || pinnedId,
        title: text(space.title) || `Space ${index + 1}`,
        emoji: text(iconType.emoji_v2),
        profile: profileKey(space.profile),
        items: pinned,
        today
      }
    ]
  })

  // topAppsContainerIDs pairs a profile with its favorites container.
  const favorites = new Map<string, ArcLink[]>()
  const topApps = Array.isArray(container.topAppsContainerIDs)
    ? container.topAppsContainerIDs
    : []
  topApps.forEach((entry, index) => {
    if (!isObject(entry)) return
    const key = profileKey(entry)
    const links = linksIn(text(topApps[index + 1])).flatMap(flattenLinks)
    favorites.set(key, uniqueLinks([...(favorites.get(key) ?? []), ...links]))
  })

  const keys = [
    ...new Set([...spaces.map((space) => space.profile), ...favorites.keys()])
  ].sort((a, b) =>
    a === DEFAULT_PROFILE ? -1 : b === DEFAULT_PROFILE ? 1 : a.localeCompare(b)
  )
  const profiles = keys
    .map((key) => ({
      key,
      label: key === DEFAULT_PROFILE ? "Main profile" : key,
      favorites: favorites.get(key) ?? []
    }))
    .filter(
      (profile) =>
        profile.favorites.length ||
        spaces.some((space) => space.profile === profile.key)
    )

  return { profiles, spaces }
}

export function flattenLinks(node: ArcNode): ArcLink[] {
  return node.kind === "link" ? [node] : node.children.flatMap(flattenLinks)
}

export function countLinks(nodes: ArcNode[]) {
  return nodes.flatMap(flattenLinks).length
}
