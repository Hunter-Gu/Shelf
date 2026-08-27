# Shelf extension

Shelf is a Chrome side panel for organizing bookmarks into workspaces.

## Development

```bash
pnpm dev
```

Load the generated `.output/chrome-mv3-dev` directory in Chrome and open the
side panel from the extension toolbar.

## Build

```bash
pnpm compile
pnpm test
pnpm build
pnpm zip
```

The extension is intentionally a single WXT side-panel application. Bookmark,
workspace, and tab behavior is owned by React hooks and calls the browser APIs
directly; there is no background RPC layer or content script.
