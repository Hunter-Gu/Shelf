import { describe, expect, it } from "vitest"

import { passageUrl } from "~/bookmark-model/passage-url"

import { highlightDirectives, originalPageUrl, pageAddress } from "./page-url"

describe("highlight page addresses", () => {
  it("matches ordinary, anchored, and passage URLs without removing query parameters", () => {
    const page = "https://example.com/article?lang=zh"
    expect(pageAddress(passageUrl("保存文本", page))).toBe(page)
    expect(pageAddress(`${page}#intro`)).toBe(page)
    expect(pageAddress("https://example.com")).toBe("https://example.com/")
    expect(pageAddress("chrome://settings")).toBeNull()
  })

  it("extracts encoded directives without decoding syntax into separators", () => {
    const page = "https://example.com/article"
    expect(highlightDirectives(passageUrl("a,b & c-d", page), page)).toEqual([
      "a%2Cb%20%26%20c%2Dd"
    ])
    expect(
      highlightDirectives(`${page}#:~:text=first&text=second%2Cword`, page)
    ).toEqual(["first", "second%2Cword"])
    expect(highlightDirectives(`${page}#:~:text=x`, `${page}?other=1`)).toEqual(
      []
    )
    expect(highlightDirectives("invalid", page)).toEqual([])
    expect(highlightDirectives(page, page)).toEqual([])
  })

  it("keeps original anchors but removes generated passage identifiers from page bookmarks", () => {
    const page = "https://example.com/article?lang=zh"
    expect(originalPageUrl(`${page}#intro`)).toBe(`${page}#intro`)
    expect(originalPageUrl(passageUrl("保存文本", page))).toBe(page)
    expect(originalPageUrl(`${page}#intro:~:text=words`)).toBe(`${page}#intro`)
  })

  it("removes a stripped passage id only when its full link identifies it", () => {
    const page = "https://example.com/article?lang=zh"
    const full = passageUrl("保存后的实际选段", page)
    const visibleUrl = full.split(":~:")[0]
    expect(originalPageUrl(visibleUrl, [full])).toBe(page)
    expect(originalPageUrl(`${page}#pricing`, [full])).toBe(`${page}#pricing`)
    expect(originalPageUrl(`${page}#parameters`, [full])).toBe(
      `${page}#parameters`
    )
    expect(
      originalPageUrl(visibleUrl, [
        full.replace("example.com", "other.example")
      ])
    ).toBe(visibleUrl)
  })
})
