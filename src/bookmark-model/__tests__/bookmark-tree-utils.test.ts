import { describe, expect, it } from "vitest"

import type { Bookmark, Folder } from "~/bookmark-model/types"

import { BookmarkTreeUtils } from "../bookmark-tree-utils"

describe("BookmarkTreeUtils", () => {
  it("#add", () => {
    const root: Folder = {
      id: "0",
      parentId: "0",
      index: 0,
      title: "root",
      children: [
        {
          id: "1",
          parentId: "0",
          index: 0,
          title: "node",
          url: ""
        }
      ]
    }
    const node: Bookmark = {
      id: "2",
      parentId: "0",
      index: 0,
      title: "bookmark",
      url: ""
    }
    BookmarkTreeUtils.add(root, node)

    expect(root).toMatchInlineSnapshot(`
			{
			  "children": [
			    {
			      "id": "2",
			      "index": 0,
			      "parentId": "0",
			      "title": "bookmark",
			      "url": "",
			    },
			    {
			      "id": "1",
			      "index": 1,
			      "parentId": "0",
			      "title": "node",
			      "url": "",
			    },
			  ],
			  "id": "0",
			  "index": 0,
			  "parentId": "0",
			  "title": "root",
			}
		`)
  })

  it("#change for folder and bookmark", () => {
    const root: Folder = {
      id: "0",
      parentId: "-1",
      index: 0,
      title: "root",
      children: [
        {
          id: "1",
          parentId: "0",
          index: 0,
          title: "node",
          url: ""
        }
      ]
    }

    BookmarkTreeUtils.change(root, {
      id: "0",
      title: "root folder"
    })

    BookmarkTreeUtils.change(root, {
      id: "1",
      title: "node",
      url: "http://"
    })

    expect(root).toMatchInlineSnapshot(`
			{
			  "children": [
			    {
			      "id": "1",
			      "index": 0,
			      "parentId": "0",
			      "title": "node",
			      "url": "http://",
			    },
			  ],
			  "id": "0",
			  "index": 0,
			  "parentId": "-1",
			  "title": "root folder",
			}
		`)
  })

  it("#change clears the title when renamed to an empty string", () => {
    const root: Folder = {
      id: "0",
      parentId: "-1",
      index: 0,
      title: "root",
      children: [
        {
          id: "1",
          parentId: "0",
          index: 0,
          title: "node",
          url: ""
        }
      ]
    }

    // Chrome's onChanged always includes the bookmark's current url in
    // changeInfo (even for a title-only edit) — omitting it here would look
    // like a folder-shaped payload and trip the isFolder mismatch guard.
    BookmarkTreeUtils.change(root, { id: "1", title: "", url: "" })

    expect((root.children?.[0] as Bookmark).title).toBe("")
  })

  it("#move", () => {
    const root: Folder = {
      id: "0",
      parentId: "-1",
      index: 0,
      title: "root",
      children: [
        {
          id: "1",
          parentId: "0",
          index: 0,
          title: "node",
          children: [
            {
              id: "2",
              parentId: "1",
              index: 0,
              title: "bookmark 1",
              url: ""
            },
            {
              id: "3",
              parentId: "1",
              index: 0,
              title: "bookmark 2",
              url: ""
            }
          ]
        }
      ]
    }

    BookmarkTreeUtils.move(root, {
      id: "2",
      index: 0,
      parentId: "0",
      oldIndex: 0,
      oldParentId: "1"
    })

    expect(root).toMatchInlineSnapshot(`
			{
			  "children": [
			    {
			      "id": "2",
			      "index": 0,
			      "parentId": "0",
			      "title": "bookmark 1",
			      "url": "",
			    },
			    {
			      "children": [
			        {
			          "id": "3",
			          "index": 0,
			          "parentId": "1",
			          "title": "bookmark 2",
			          "url": "",
			        },
			      ],
			      "id": "1",
			      "index": 1,
			      "parentId": "0",
			      "title": "node",
			    },
			  ],
			  "id": "0",
			  "index": 0,
			  "parentId": "-1",
			  "title": "root",
			}
		`)
  })

  it("#remove", () => {
    const root: Folder = {
      id: "0",
      parentId: "-1",
      index: 0,
      title: "root",
      children: [
        {
          id: "1",
          parentId: "0",
          index: 0,
          title: "node",
          url: ""
        },
        {
          id: "2",
          parentId: "0",
          index: 1,
          title: "bookmark",
          url: ""
        }
      ]
    }

    BookmarkTreeUtils.remove(root, {
      id: "1",
      index: 0,
      parentId: "0"
    })

    expect(root).toMatchInlineSnapshot(`
			{
			  "children": [
			    {
			      "id": "2",
			      "index": 0,
			      "parentId": "0",
			      "title": "bookmark",
			      "url": "",
			    },
			  ],
			  "id": "0",
			  "index": 0,
			  "parentId": "-1",
			  "title": "root",
			}
		`)
  })

  it("#remove reindexes nested siblings", () => {
    const root: Folder = {
      id: "0",
      parentId: "-1",
      index: 0,
      title: "root",
      children: [
        {
          id: "1",
          parentId: "0",
          index: 0,
          title: "folder",
          children: [
            { id: "2", parentId: "1", index: 0, title: "first", url: "" },
            { id: "3", parentId: "1", index: 1, title: "second", url: "" }
          ]
        }
      ]
    }

    BookmarkTreeUtils.remove(root, { id: "2", index: 0, parentId: "1" })

    const folder = root.children?.[0]
    expect(
      folder && "children" in folder ? folder.children?.[0] : undefined
    ).toMatchObject({ id: "3", index: 0 })
  })

  it("#remove falls back to locating by id when the reported index is stale", () => {
    const root: Folder = {
      id: "0",
      parentId: "-1",
      index: 0,
      title: "root",
      children: [
        { id: "1", parentId: "0", index: 0, title: "first", url: "" },
        { id: "2", parentId: "0", index: 1, title: "second", url: "" },
        { id: "3", parentId: "0", index: 2, title: "third", url: "" }
      ]
    }

    // Index 0 actually points at "first", but we're asking to remove "third" —
    // as if a prior patch had drifted. It should still remove the right node
    // by id instead of deleting whatever sits at index 0.
    BookmarkTreeUtils.remove(root, { id: "3", index: 0, parentId: "0" })

    expect(root.children?.map((child) => child.id)).toEqual(["1", "2"])
  })

  it("#remove is a no-op when the id isn't found under the given parent", () => {
    const root: Folder = {
      id: "0",
      parentId: "-1",
      index: 0,
      title: "root",
      children: [{ id: "1", parentId: "0", index: 0, title: "first", url: "" }]
    }

    BookmarkTreeUtils.remove(root, { id: "missing", index: 0, parentId: "0" })

    expect(root.children?.map((child) => child.id)).toEqual(["1"])
  })

  it("#reorder", () => {
    const root: Folder = {
      id: "0",
      parentId: "-1",
      index: 0,
      title: "root",
      children: [
        {
          id: "1",
          parentId: "0",
          index: 0,
          title: "node",
          url: ""
        },
        {
          id: "2",
          parentId: "0",
          index: 1,
          title: "bookmark 1",
          url: ""
        },
        {
          id: "3",
          parentId: "0",
          index: 2,
          title: "bookmark 2",
          url: ""
        }
      ]
    }

    BookmarkTreeUtils.reorder(root, {
      id: "0",
      childIds: ["3", "1", "2"]
    })

    expect(root).toMatchInlineSnapshot(`
			{
			  "children": [
			    {
			      "id": "3",
			      "index": 0,
			      "parentId": "0",
			      "title": "bookmark 2",
			      "url": "",
			    },
			    {
			      "id": "1",
			      "index": 1,
			      "parentId": "0",
			      "title": "node",
			      "url": "",
			    },
			    {
			      "id": "2",
			      "index": 2,
			      "parentId": "0",
			      "title": "bookmark 1",
			      "url": "",
			    },
			  ],
			  "id": "0",
			  "index": 0,
			  "parentId": "-1",
			  "title": "root",
			}
		`)
  })
})
