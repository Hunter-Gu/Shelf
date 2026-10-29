import { describe, expect, it } from "vitest"

import { createWorkspace, WorkspaceType } from "./workspace"

describe("createWorkspace", () => {
  it("gives Home a default emoji when it has none", () => {
    const home = createWorkspace({
      id: "1",
      title: "Home",
      logo: "",
      type: WorkspaceType.BookmarksBar
    })

    expect(home.logo).toBe("🏠")
  })

  it("keeps Home's own emoji and leaves other workspaces without one", () => {
    expect(
      createWorkspace({
        id: "1",
        title: "Home",
        logo: "📚",
        type: WorkspaceType.BookmarksBar
      }).logo
    ).toBe("📚")
    expect(createWorkspace({ id: "10", title: "Read", logo: "" }).logo).toBe("")
  })
})
