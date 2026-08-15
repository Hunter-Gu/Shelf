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

  it("continues to parse names without an emoji", () => {
    expect(workspaceName.isValid("Read  (Workspace)")).toBe(true)
    expect(workspaceName.parse("Read  (Workspace)")).toBe("Read")
    expect(workspaceName.parseLogo("Read  (Workspace)")).toBe("")
  })
})
