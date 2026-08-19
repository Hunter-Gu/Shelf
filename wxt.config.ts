import { fileURLToPath } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "wxt"

export default defineConfig({
  srcDir: fileURLToPath(new URL("./src", import.meta.url)),
  alias: {
    common: fileURLToPath(new URL("./src/common", import.meta.url))
  },
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Shelf – Bookmark Manager & Workspaces",
    description: "Bookmarks, organized your way.",
    minimum_chrome_version: "116",
    action: {
      default_title: "Open Shelf",
      // Default (no active tab yet) matches the "not bookmarked" state; the
      // background script overrides this per-tab once it knows whether the
      // active tab's URL is saved — see updateActionIcon in background.ts.
      default_icon: {
        16: "icon/stroke/16.png",
        32: "icon/stroke/32.png",
        48: "icon/stroke/48.png",
        128: "icon/stroke/128.png"
      }
    },
    commands: {
      "open-panel": {
        suggested_key: {
          default: "Ctrl+Shift+K",
          mac: "Command+Shift+K"
        },
        description: "Open Shelf and focus search"
      }
    },
    permissions: ["bookmarks", "favicon", "storage", "tabs", "tabGroups"]
  },
  vite: () => ({
    plugins: [tailwindcss()]
  })
})
