import { describe, expect, it } from "vitest"

import { formatShelfTitle, parseShelfTitle } from "./shelf-title"

describe("shelf title", () => {
  it("formats a plain marker and one carrying a role", () => {
    expect(formatShelfTitle("Read", { logo: "🧠" })).toBe("[🧠] Read (Shelf)")
    expect(formatShelfTitle("Reading", { role: "Home" })).toBe(
      "Reading (Shelf|Home)"
    )
  })

  it("parses name, logo and role back out", () => {
    expect(parseShelfTitle("[🏠] Reading (Shelf|Home)")).toEqual({
      logo: "🏠",
      name: "Reading",
      role: "Home"
    })
    expect(parseShelfTitle("Read (Shelf)")).toEqual({
      logo: "",
      name: "Read",
      role: undefined
    })
  })

  it("reads only the last marker, so a name can contain one", () => {
    const title = formatShelfTitle("My (Shelf|Home)")

    expect(title).toBe("My (Shelf|Home) (Shelf)")
    expect(parseShelfTitle(title)).toEqual({
      logo: "",
      name: "My (Shelf|Home)",
      role: undefined
    })
  })

  it("rejects titles without the marker", () => {
    expect(parseShelfTitle("Read")).toBeNull()
    expect(parseShelfTitle("Read (Workspace)")).toBeNull()
    expect(parseShelfTitle("Read (Shelf) notes")).toBeNull()
  })
})
