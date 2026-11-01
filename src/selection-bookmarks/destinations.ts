import { LEGACY_SPECIAL_TITLES } from "~/pin-model/pin-folder"
import { parseShelfTitle } from "~/shelf-title"
import { workspaceName } from "~/workspace-model/workspace-name"

import { ordinaryBookmarks, type BookmarkNode } from "./folder"
import { highlightDirectives, pageAddress } from "./page-url"

export type BookmarkDestination = {
  id: string
  title: string
  path: string
  parentId?: string
  kind: "space" | "folder"
}

export function bookmarkDestinations(
  tree: BookmarkNode
): BookmarkDestination[] {
  const excluded = (node: BookmarkNode) => {
    const role = parseShelfTitle(node.title)?.role
    return !!(
      node.url ||
      node.unmodifiable ||
      Object.values(LEGACY_SPECIAL_TITLES).includes(node.title) ||
      (role && role !== "Home")
    )
  }
  const roots = (tree.children ?? []).filter((node) => !excluded(node))
  const scan = (node: BookmarkNode): BookmarkNode[] =>
    excluded(node) ? [] : [node, ...(node.children ?? []).flatMap(scan)]
  const homeNode =
    roots.flatMap(scan).find((node) => workspaceName.isHome(node.title)) ??
    roots[0]
  if (!homeNode) return []
  const homeTitle = workspaceName.isHome(homeNode.title)
    ? workspaceName.parse(homeNode.title)
    : workspaceName.home
  const home: BookmarkDestination = {
    id: homeNode.id,
    title: homeTitle,
    path: homeTitle,
    kind: "space"
  }
  const walk = (
    node: BookmarkNode,
    parent: BookmarkDestination
  ): BookmarkDestination[] => {
    if (excluded(node)) return []
    if (node.id === home.id)
      return (node.children ?? []).flatMap((child) => walk(child, home))
    const space = workspaceName.isValid(node.title)
    const title = workspaceName.parse(node.title)
    const destination: BookmarkDestination = {
      id: node.id,
      title,
      path: space ? title : `${parent.path} / ${title}`,
      parentId: space ? undefined : parent.id,
      kind: space ? "space" : "folder"
    }
    return [
      destination,
      ...(node.children ?? []).flatMap((child) => walk(child, destination))
    ]
  }
  return [
    home,
    ...roots.flatMap((root) =>
      (root.children ?? []).flatMap((child) => walk(child, home))
    )
  ]
}

export function matchingPageBookmarks(tree: BookmarkNode, pageUrl: string) {
  return ordinaryBookmarks(tree).filter(
    (node) =>
      node.url &&
      !highlightDirectives(node.url, pageUrl).length &&
      pageAddress(node.url) === pageAddress(pageUrl)
  )
}

export function pageDestinations(
  tree: BookmarkNode,
  pageUrl: string,
  workspaceId: string
) {
  const folders = bookmarkDestinations(tree)
  const existing = matchingPageBookmarks(tree, pageUrl).find((node) =>
    folders.some((folder) => folder.id === node.parentId)
  )
  const defaultId =
    existing?.parentId ??
    folders.find(
      (folder) => folder.kind === "space" && folder.id === workspaceId
    )?.id ??
    folders[0]?.id
  const destinationId = folders.find((folder) => folder.id === defaultId)?.id
  return { folders, destinationId }
}
