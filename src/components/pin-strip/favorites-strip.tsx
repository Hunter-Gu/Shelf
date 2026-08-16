import { useAppContext } from "~/app/app-context"

import { PinStrip } from "./pin-strip"

// Global across every workspace, so unlike PinnedStrip this needs no
// scoping — the special folder's own contents are already the full list.
export function FavoritesStrip() {
  const { pins, tabs } = useAppContext()

  return (
    <PinStrip
      items={pins.favoriteItems}
      activeUrl={tabs.activeTab?.url}
      onRemove={pins.unfavorite}
    />
  )
}
