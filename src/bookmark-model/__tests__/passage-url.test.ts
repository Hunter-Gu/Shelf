import { describe, expect, it } from "vitest"

import { passageUrl } from "../passage-url"

const PAGE = "https://example.com/post"

function directive(url: string) {
  return url.split(":~:text=")[1]
}

describe("passageUrl", () => {
  it("points at the page, with a fragment the browser follows to the passage", () => {
    expect(passageUrl("automated evals", PAGE)).toMatch(
      /^https:\/\/example\.com\/post#p[0-9a-z]+:~:text=automated%20evals$/
    )
  })

  it("names a long passage by its first and last words", () => {
    expect(
      directive(
        passageUrl(
          "An evaluation is a test for an AI system: give an AI an input, then apply grading logic.",
          PAGE
        )
      )
    ).toBe("An%20evaluation%20is%20a,then%20apply%20grading%20logic.")
  })

  it("cuts text without spaces by characters", () => {
    expect(
      directive(
        passageUrl(
          "评估是对人工智能系统的测试给它一个输入然后用评分逻辑衡量输出",
          PAGE
        )
      )
    ).toBe(
      `${encodeURIComponent("评估是对人工智能系统的测")},${encodeURIComponent("入然后用评分逻辑衡量输出")}`
    )
  })

  it("cuts by characters when a few spaces leave long words", () => {
    const sentence =
      "评估是对人工智能系统的测试给它一个输入然后用评分逻辑衡量输出"
    const url = passageUrl(Array(20).fill(sentence).join(" "), PAGE)
    expect(url.length).toBeLessThan(400)
    expect(directive(url)).toBe(
      `${encodeURIComponent("评估是对人工智能系统的测")},${encodeURIComponent("入然后用评分逻辑衡量输出")}`
    )
    expect(
      passageUrl(Array(4).fill(sentence.repeat(10)).join(" "), PAGE).length
    ).toBeLessThan(400)
  })

  it("does not split an emoji when cutting by characters", () => {
    expect(() => passageUrl(`a${"😀".repeat(40)}`, PAGE)).not.toThrow()
  })

  it("escapes the characters a text directive reserves", () => {
    expect(directive(passageUrl("multi-turn, agentic & more", PAGE))).toBe(
      "multi%2Dturn%2C%20agentic%20%26%20more"
    )
  })

  it("replaces a fragment the page address already had", () => {
    expect(passageUrl("evals", `${PAGE}?a=1#section`)).toMatch(
      /^https:\/\/example\.com\/post\?a=1#p[0-9a-z]+:~:text=evals$/
    )
  })

  it("keeps apart passages that share their first and last words", () => {
    const one =
      "An evaluation is a test that checks one thing and then apply grading logic."
    const other =
      "An evaluation is a test that checks another thing and then apply grading logic."
    expect(directive(passageUrl(one, PAGE))).toBe(
      directive(passageUrl(other, PAGE))
    )
    expect(passageUrl(one, PAGE)).not.toBe(passageUrl(other, PAGE))
  })

  it("gives the same passage the same address however it was spaced", () => {
    expect(passageUrl("  automated   evals ", PAGE)).toBe(
      passageUrl("automated evals", PAGE)
    )
  })
})
