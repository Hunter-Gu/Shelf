import { describe, expect, it } from "vitest"

import { passageUrl } from "~/bookmark-model/passage-url"

import { selectionBookmark } from "./selection-bookmark"

describe("selectionBookmark", () => {
  it("uses the selected text as the title and the passage algorithm as the URL", () => {
    const text = "评估是对人工智能系统的测试给它一个输入然后用评分逻辑衡量输出"
    const page = "https://example.com/article?lang=zh#section"
    expect(selectionBookmark(text, page)).toEqual({
      title: text,
      url: passageUrl(text, page)
    })
  })

  it("normalizes selection whitespace without generating or shortening its title", () => {
    const text = Array(30).fill("original text").join(" ")
    expect(
      selectionBookmark(`  ${text}\n next\tline  `, "https://example.com")
        ?.title
    ).toBe(`${text} next line`)
  })

  it("rejects empty selections, invalid addresses, and unsupported protocols", () => {
    expect(selectionBookmark(" \n\t ", "https://example.com")).toBeNull()
    for (const page of [
      "invalid",
      "chrome://settings",
      "file:///doc.txt",
      "javascript:alert(1)"
    ]) {
      expect(selectionBookmark("selected text", page)).toBeNull()
    }
  })

  it("keeps passages and the whole-page bookmark at distinct addresses", () => {
    const page = "https://example.com/article"
    const first = selectionBookmark("first passage", page)
    const second = selectionBookmark("second passage", page)
    expect(first?.url).not.toBe(second?.url)
    expect(first?.url).not.toBe(page)
  })
})
