# Chrome Web Store listing

The name and summary come from the manifest (`wxt.config.ts`); the rest is
pasted into the developer dashboard.

**Name** (manifest, max 75): Shelf – Arc-Style Bookmark Manager

**Summary** (manifest, max 132): Arc-style bookmarks in Chrome's side panel:
spaces, pinned links and favorites, kept as your own Chrome bookmarks. Open
source.

**Category:** Productivity → Workflow & Planning

## Description

Shelf puts your bookmarks in a sidebar next to your tabs, organized into spaces with pinned links and favorites — the way Arc's sidebar kept the sites you return to, but inside the Chrome you already use. Shelf manages bookmarks, not open tabs.

Everything Shelf shows is a real Chrome bookmark. Spaces are bookmark folders, pinned links and favorites are bookmarks too, so they sync with your Google account like any other bookmark and stay in Chrome even if you uninstall Shelf. No account, no server, nothing to export later.

WHAT YOU GET

• Spaces for every context — work, research, side projects, travel. Switch with one click from the dock at the bottom.
• Favorites that stay visible at the top of the sidebar.
• Pinned links for what matters right now, without moving them out of their folders.
• Click a bookmark that's already open and Shelf takes you to that tab instead of opening it twice.
• Drag and drop to rearrange bookmarks and folders, including across spaces.
• Instant search across all your bookmarks. Press Ctrl+Shift+K (⌘+Shift+K on Mac) to open Shelf straight into search.
• Save the page you're on in one click, and Shelf offers to move it into the folder that already holds that site's bookmarks.
• Open a whole space as a Chrome tab group.
• Already have bookmark folders? Turn several into spaces at once, renaming them and picking an emoji as you go.

MOVING FROM ARC?

Arc stops working on December 22, 2026. If you relied on its sidebar for spaces and pinned links, Shelf gives you the same layout in Chrome, and because it is built on Chrome bookmarks, it can't be shut down on you: your spaces are ordinary bookmark folders you keep either way.

Bring your Arc sidebar over in one step: open Settings → Import from Arc and pick Arc's sidebar file. Each space comes over with its pinned tabs and folders, Arc's favorites become Shelf's favorites, and your open Today tabs can come along too. Importing again only adds what's missing.

HOW SHELF CHANGES YOUR BOOKMARKS

Shelf adds a few folders to keep your spaces: each space is a folder in the Bookmarks Bar named like "Work (Shelf)", and pinned links and favorites live in "Pins (Shelf|Pins)" and "Favorites (Shelf|Favorites)" under Other Bookmarks. Rename or delete them in Chrome's bookmark manager like any folder.

PRIVACY

Shelf needs no account and sends nothing anywhere while you use it. It only uses Chrome's bookmark, storage, tab and tab-group APIs on your device. When you remove it, Chrome opens a short page asking why; answering is optional and anonymous.

OPEN SOURCE

Shelf is free and open source under the MIT license.

Shelf is made by Carrel (usecarrel.app). It is not affiliated with Arc or The Browser Company.

## Store fields

- **Homepage URL:** https://usecarrel.app/shelf
- **Support URL:** https://usecarrel.app/support
- **Privacy policy URL:** https://usecarrel.app/privacy (its "Shelf" section)
- **Language:** English
- **Graphics:** `1.png`–`5.png` as screenshots (1280×800), `small-promo.png` as
  the small promo tile (440×280), `marquee.png` as the marquee (1400×560),
  `logo.png` as the store icon (128×128).

## Privacy practices tab

**Single purpose:** Show and organize the user's Chrome bookmarks in the side
panel, grouped into spaces with pinned links and favorites.

**Permission justifications:**

- `bookmarks` — Shelf's spaces, pins and favorites are Chrome bookmarks and
  folders. It reads the bookmark tree to show it and creates, renames, moves
  and removes bookmarks and folders when the user organizes them.
- `storage` — Keeps the order and color of spaces and small interface
  preferences, such as which space is open and whether pins are collapsed.
- `tabs` — Opens bookmarks in tabs and windows, and reads the active tab's
  address to show whether the current page is already bookmarked.
- `tabGroups` — "Open All in New Tab Group" opens a space or folder as a named
  Chrome tab group.
- `favicon` — Shows each bookmark's site icon from Chrome's local favicon
  cache, without requesting it from the network.
- `sidePanel` — Shelf's interface is a Chrome side panel.

**Remote code:** No. All code is included in the package.

**Data usage:** Collects none of the listed categories. Bookmarks are read and
changed only on the device and are never sent to a server. Tick the three
certifications (no selling or transfer, no unrelated use, no creditworthiness
use).
