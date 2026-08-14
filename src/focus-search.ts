import { storage } from "wxt/utils/storage"

// The "open-panel" command needs to tell the sidebar to focus search, but
// the panel might be closed (about to mount fresh) or already open (no
// remount, so a stored flag checked on mount would never be read again).
// Both paths are covered: a session flag for the cold-open case, a live
// runtime message for the already-open case.
export const FOCUS_SEARCH_MESSAGE = "focus-search"

export const focusSearchOnOpenStorage = storage.defineItem<boolean>(
  "session:focusSearchOnOpen",
  { fallback: false }
)
