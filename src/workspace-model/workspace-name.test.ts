import { describe, expect, it } from "vitest"

import { workspaceName } from "./workspace-name"

describe("workspaceName", () => {
  it("formats names with and without an emoji", () => {
    expect(workspaceName.format("Read", "🧠")).toBe("[🧠] Read (Shelf)")
    expect(workspaceName.format("Read")).toBe("Read (Shelf)")
  })

  it("parses profile spacing flexibly", () => {
    for (const folderTitle of [
      "[🧠] Read (Shelf)",
      "[🧠]Read(Shelf)",
      "[ 🧠 ]   Read   (Shelf)"
    ]) {
      expect(workspaceName.isValid(folderTitle)).toBe(true)
      expect(workspaceName.parse(folderTitle)).toBe("Read")
      expect(workspaceName.parseLogo(folderTitle)).toBe("🧠")
    }
  })

  it("recognises Home by its marker, whatever it has been renamed to", () => {
    expect(workspaceName.isHome("[🏠] Reading (Shelf|Home)")).toBe(true)
    expect(workspaceName.isHome(workspaceName.formatHome("工作"))).toBe(true)
    // A name is just a name — only the generated marker counts.
    expect(workspaceName.isHome("Home (Shelf)")).toBe(false)
    expect(workspaceName.isHome("Home")).toBe(false)
  })

  it("parses a Home folder title like any other workspace", () => {
    const title = workspaceName.formatHome("Reading", "🏠")

    expect(title).toBe("[🏠] Reading (Shelf|Home)")
    expect(workspaceName.isValid(title)).toBe(true)
    expect(workspaceName.parse(title)).toBe("Reading")
    expect(workspaceName.parseLogo(title)).toBe("🏠")
  })

  it("doesn't take Shelf's pins or favorites folders for workspaces", () => {
    expect(workspaceName.isValid("Pins (Shelf|Pins)")).toBe(false)
    expect(workspaceName.isValid("Favorites (Shelf|Favorites)")).toBe(false)
    expect(workspaceName.isHome("Pins (Shelf|Pins)")).toBe(false)
  })

  it("treats names differing only by case or padding as taken", () => {
    const taken = ["Home", "Read"]

    expect(workspaceName.isTaken("read", taken)).toBe(true)
    expect(workspaceName.isTaken("  Home ", taken)).toBe(true)
    expect(workspaceName.isTaken("Reading", taken)).toBe(false)
  })

  it("disambiguates a taken name by counting up", () => {
    expect(workspaceName.disambiguate("Read", ["Home"])).toBe("Read")
    expect(workspaceName.disambiguate("Read", ["read"])).toBe("Read 2")
    expect(workspaceName.disambiguate("Read", ["Read", "Read 2"])).toBe(
      "Read 3"
    )
    expect(workspaceName.disambiguate("Home", ["Home"])).toBe("Home 2")
  })

  it("continues to parse names without an emoji", () => {
    expect(workspaceName.isValid("Read  (Shelf)")).toBe(true)
    expect(workspaceName.parse("Read  (Shelf)")).toBe("Read")
    expect(workspaceName.parseLogo("Read  (Shelf)")).toBe("")
  })
})
