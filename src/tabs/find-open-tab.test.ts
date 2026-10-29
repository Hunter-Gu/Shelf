import { describe, expect, it } from "vitest"

import { findOpenTab } from "./find-open-tab"

const tabs = [
  { id: 1, windowId: 10, url: "https://a.example/" },
  { id: 2, windowId: 20, url: "https://b.example/docs" },
  { id: 3, windowId: 10, url: "https://b.example/docs" },
  { id: 4, windowId: 20, url: "https://c.example/" }
]

describe("findOpenTab", () => {
  it("finds a tab showing the address, preferring the current window", () => {
    expect(findOpenTab(tabs, "https://b.example/docs", 10)?.id).toBe(3)
    expect(findOpenTab(tabs, "https://b.example/docs", 20)?.id).toBe(2)
  })

  it("falls back to another window", () => {
    expect(findOpenTab(tabs, "https://c.example/", 10)?.id).toBe(4)
  })

  it("matches an address Chrome stored with a trailing slash", () => {
    expect(findOpenTab(tabs, "https://a.example", 10)?.id).toBe(1)
  })

  it("finds nothing when the address isn't open", () => {
    expect(findOpenTab(tabs, "https://d.example/", 10)).toBeUndefined()
    expect(findOpenTab(tabs, "https://a.example/other", 10)).toBeUndefined()
  })
})
