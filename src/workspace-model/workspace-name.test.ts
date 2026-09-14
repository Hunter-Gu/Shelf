import { describe, expect, it } from "vitest"

import { workspaceName } from "./workspace-name"

describe("workspaceName", () => {
  it("formats names with and without an emoji", () => {
    expect(workspaceName.format("Read", "🧠")).toBe(
      "[🧠] Read (Workspace)"
    )
    expect(workspaceName.format("Read")).toBe("Read (Workspace)")
  })

  it("parses profile spacing flexibly", () => {
    for (const folderTitle of [
      "[🧠] Read (Workspace)",
      "[🧠]Read(Workspace)",
      "[ 🧠 ]   Read   (Workspace)"
    ]) {
      expect(workspaceName.isValid(folderTitle)).toBe(true)
      expect(workspaceName.parse(folderTitle)).toBe("Read")
      expect(workspaceName.parseLogo(folderTitle)).toBe("🧠")
    }
  })

  it("recognises Home by its marker, whatever it has been renamed to", () => {
    expect(workspaceName.isHome("[🏠] Reading (Home Workspace)")).toBe(true)
    expect(workspaceName.isHome(workspaceName.formatHome("工作"))).toBe(true)
    // A name is just a name — only the generated marker counts.
    expect(workspaceName.isHome("Home (Workspace)")).toBe(false)
    expect(workspaceName.isHome("Home")).toBe(false)
  })

  it("parses a Home folder title like any other workspace", () => {
    const title = workspaceName.formatHome("Reading", "🏠")

    expect(title).toBe("[🏠] Reading (Home Workspace)")
    expect(workspaceName.isValid(title)).toBe(true)
    expect(workspaceName.parse(title)).toBe("Reading")
    expect(workspaceName.parseLogo(title)).toBe("🏠")
  })

  it("continues to parse names without an emoji", () => {
    expect(workspaceName.isValid("Read  (Workspace)")).toBe(true)
    expect(workspaceName.parse("Read  (Workspace)")).toBe("Read")
    expect(workspaceName.parseLogo("Read  (Workspace)")).toBe("")
  })
})
