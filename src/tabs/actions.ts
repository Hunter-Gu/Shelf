import { browser } from "wxt/browser"

import { findOpenTab } from "./find-open-tab"

export const tabManager = {
  async create(
    input: string[] | Parameters<typeof browser.tabs.create>[0],
    options?: Omit<
      Parameters<typeof browser.tabs.create>[0],
      "active" | "selected"
    >
  ) {
    if (Array.isArray(input)) {
      return Promise.all(
        input.map((url, index) =>
          browser.tabs.create({
            ...options,
            url,
            active: index === 0
          })
        )
      )
    }

    return browser.tabs.create(input)
  },

  async createInGroup(title: string, urls: string[]) {
    if (!urls.length) return
    const tabs = await Promise.all(
      urls.map((url, index) =>
        browser.tabs.create({ url, active: index === 0 })
      )
    )
    const tabIds = tabs
      .map((tab) => tab.id)
      .filter((id): id is number => typeof id === "number")
    if (!tabIds.length) return

    const groupId = (await browser.tabs.group({
      tabIds: tabIds as [number, ...number[]]
    })) as number
    await browser.tabGroups.update(groupId, { title })
    return groupId
  },

  // Goes to the tab already showing this page, as Arc's pinned tabs did;
  // only when none is open does the current tab navigate there.
  async switchToOrOpen(url: string) {
    const [current] = await browser.tabs.query({
      active: true,
      currentWindow: true
    })
    const open = findOpenTab(
      await browser.tabs.query({}),
      url,
      current?.windowId
    )

    if (open?.id !== undefined) {
      await browser.tabs.update(open.id, { active: true })
      if (open.windowId !== current?.windowId) {
        await browser.windows.update(open.windowId, { focused: true })
      }
      return
    }

    if (current?.id === undefined) {
      await browser.tabs.create({ url, active: true })
    } else {
      await browser.tabs.update(current.id, { url })
    }
  },

  createInNewWindow(url: string | string[], incognito = false) {
    return browser.windows.create({ url, incognito })
  },

  query(query: Parameters<typeof browser.tabs.query>[0]) {
    return browser.tabs.query(query)
  },

  update(id: number, properties: Parameters<typeof browser.tabs.update>[1]) {
    return browser.tabs.update(id, properties)
  }
}
