import { describe, expect, it } from "vitest"

import {
  isHighlightMutation,
  MOVE_HIGHLIGHT,
  RECOLOR_HIGHLIGHT,
  REMOVE_HIGHLIGHT,
  SAVE_HIGHLIGHT
} from "./messages"

describe("isHighlightMutation", () => {
  it("accepts well-formed save, recolor, move and remove requests", () => {
    expect(
      isHighlightMutation({
        type: SAVE_HIGHLIGHT,
        text: "quote",
        title: "Page",
        folderId: "research",
        color: "pink"
      })
    ).toBe(true)
    expect(
      isHighlightMutation({ type: RECOLOR_HIGHLIGHT, id: "42", color: "blue" })
    ).toBe(true)
    expect(
      isHighlightMutation({
        type: MOVE_HIGHLIGHT,
        id: "42",
        title: "Page",
        folderId: "research"
      })
    ).toBe(true)
    expect(isHighlightMutation({ type: REMOVE_HIGHLIGHT, id: "42" })).toBe(true)
  })

  it("rejects missing text, identifiers, folders or unknown colors", () => {
    for (const message of [
      null,
      {},
      {
        type: SAVE_HIGHLIGHT,
        text: " ",
        title: "Page",
        folderId: "f",
        color: "pink"
      },
      { type: SAVE_HIGHLIGHT, text: "quote", title: "Page", folderId: "f" },
      {
        type: SAVE_HIGHLIGHT,
        text: "quote",
        title: "Page",
        folderId: "f",
        color: "red"
      },
      { type: RECOLOR_HIGHLIGHT, id: "42", color: "red" },
      { type: MOVE_HIGHLIGHT, id: "42", title: "Page", folderId: "" },
      { type: MOVE_HIGHLIGHT, id: "42", title: 42, folderId: "f" },
      { type: REMOVE_HIGHLIGHT },
      { type: REMOVE_HIGHLIGHT, id: "" },
      { type: "selection-bookmarks/unknown", id: "42" }
    ]) {
      expect(isHighlightMutation(message)).toBe(false)
    }
  })
})
