import { describe, expect, it } from "vitest"

import { selectionPreferences } from "./preferences"

describe("selectionPreferences", () => {
  it("starts on, yellow, above the selection", () => {
    expect(selectionPreferences(null)).toEqual({
      enabled: true,
      defaultColor: "yellow",
      popupPosition: "above"
    })
  })

  it("keeps valid values and replaces unsupported ones", () => {
    expect(
      selectionPreferences({
        enabled: "no",
        defaultColor: "red",
        popupPosition: "below"
      })
    ).toEqual({ enabled: true, defaultColor: "yellow", popupPosition: "below" })
    expect(
      selectionPreferences({
        enabled: false,
        defaultColor: "blue",
        popupPosition: "left"
      })
    ).toEqual({ enabled: false, defaultColor: "blue", popupPosition: "above" })
  })
})
