import { browser } from "wxt/browser"

import { bookmarkDestinations, type BookmarkDestination } from "./destinations"
import { selectionPreferencesStorage } from "./preferences-storage"

const ROOT_ID = "save-selection"
export const SELECTION_DESTINATION_PREFIX = "save-selection-to:"

function create(details: Parameters<typeof browser.contextMenus.create>[0]) {
  return new Promise<void>((resolve, reject) => {
    browser.contextMenus.create({ ...details, contexts: ["selection"] }, () => {
      const error = browser.runtime.lastError?.message
      if (error) reject(new Error(error))
      else resolve()
    })
  })
}

export function registerSelectionMenuTree() {
  let pending = Promise.resolve()
  // Most bookmark changes (adding a link, reordering) leave the folder list as
  // it was, so the menu is only rebuilt when that list changes.
  let builtFolders = ""
  const rebuild = (force = false) => {
    pending = pending
      .catch(() => {})
      .then(async () => {
        const [[tree], { enabled }] = await Promise.all([
          browser.bookmarks.getTree(),
          selectionPreferencesStorage.getValue()
        ])
        const folders = tree ? bookmarkDestinations(tree) : []
        const signature = JSON.stringify(
          folders.map(({ id, title, parentId }) => [id, title, parentId])
        )
        if (!force && signature === builtFolders) return
        builtFolders = signature
        await browser.contextMenus.removeAll()
        await create({
          id: ROOT_ID,
          title: "Save selected text to Shelf",
          visible: enabled,
          documentUrlPatterns: ["http://*/*", "https://*/*"]
        })
        if (!folders.length) return
        const add = async (folder: BookmarkDestination, parentId: string) => {
          const children = folders.filter(
            (child) => child.parentId === folder.id
          )
          const saveId = SELECTION_DESTINATION_PREFIX + folder.id
          const title = folder.title || "Untitled folder"
          if (!children.length) {
            await create({ id: saveId, parentId, title })
            return
          }
          const branchId = "save-selection-branch:" + folder.id
          await create({ id: branchId, parentId, title })
          await create({ id: saveId, parentId: branchId, title: "Save here" })
          await create({
            id: "save-selection-divider:" + folder.id,
            parentId: branchId,
            type: "separator"
          })
          await Promise.all(children.map((child) => add(child, branchId)))
        }
        await Promise.all(
          folders
            .filter((folder) => !folder.parentId)
            .map((folder) => add(folder, ROOT_ID))
        )
      })
      .catch((error: unknown) => {
        builtFolders = ""
        console.error("Failed to register selection bookmark locations", error)
      })
    return pending
  }
  let timer: ReturnType<typeof setTimeout> | undefined
  const changed = () => {
    clearTimeout(timer)
    timer = setTimeout(() => void rebuild(), 150)
  }
  const updateEnabled = (enabled: boolean) => {
    void browser.contextMenus
      .update(ROOT_ID, { visible: enabled })
      .catch(() => rebuild(true))
  }
  selectionPreferencesStorage.watch(({ enabled }) => updateEnabled(enabled))
  browser.runtime.onInstalled.addListener(() => {
    void rebuild(true)
  })
  browser.runtime.onStartup.addListener(() => {
    void rebuild(true)
  })
  browser.bookmarks.onCreated.addListener(changed)
  browser.bookmarks.onChanged.addListener(changed)
  browser.bookmarks.onMoved.addListener(changed)
  browser.bookmarks.onRemoved.addListener(changed)
  browser.bookmarks.onImportEnded.addListener(changed)
}
