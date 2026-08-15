# Markit extension

Markit is a Chrome side panel for organizing bookmarks into workspaces.

## Development

```bash
pnpm --filter wxt-sider dev
```

Load the generated `.output/chrome-mv3-dev` directory in Chrome and open the
side panel from the extension toolbar.

## Build

```bash
pnpm --filter wxt-sider compile
pnpm --filter wxt-sider test
pnpm --filter wxt-sider build
pnpm --filter wxt-sider zip
```

The extension is intentionally a single WXT side-panel application. Bookmark,
workspace, and tab behavior is owned by React hooks and calls the browser APIs
directly; there is no background RPC layer or content script.

## Product notes

### Bookmark pinning

Bookmark pinning is planned as two distinct scopes with different names and
placements:

- **Pinned** bookmarks belong to one workspace and appear above that
  workspace's regular bookmark tree.
- **Favorites** are global shortcuts that appear in every workspace. Favorites
  should use a compact, visually separate area and be limited to a small set.

Pins are references to existing Chrome bookmark nodes, not copied or moved
bookmarks. Titles, URLs, and favicons continue to come from the source bookmark.
A bookmark can be regular, pinned in its workspace, or a global favorite; it
should not appear in both pinned scopes at once. Removing the source bookmark
also removes its pin reference.

The initial implementation should support bookmarks only, expose the actions
through the bookmark context menu, and keep drag-to-pin and pinned folders out
of scope until the basic interaction has been validated.

### Workspace data versions

`sync:workspaces` uses wxt's built-in `storage.defineItem` versioning
(`src/workspace-model/storage/workspace-storage.ts`) rather than a hand-rolled
migration system — wxt already tracks a version number per key and runs
`migrations[targetVersion]` functions (which may be async, so they can call
`browser.bookmarks.*`) automatically before the item is ever read. A stored
value with no recorded version is treated as v1.

v1 is the original plain `Workspace[]`, `logo` included. v2 moves `logo` out
of storage entirely — it's re-derived from the bookmark folder's title (see
`workspace-name.ts`'s `[emoji] Title (Workspace)` format) via
`proof-workspaces.ts`, so storage only needs to carry `StoredWorkspace`
(`Workspace` minus `logo`). The v2 migration renames each Normal workspace's
bookmark folder to embed its existing `logo` before dropping the field.
