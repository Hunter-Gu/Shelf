import tailwindcss from "@tailwindcss/vite"
import { fileURLToPath } from "node:url"
import { defineConfig } from "wxt"

export default defineConfig({
  srcDir: fileURLToPath(new URL("./src", import.meta.url)),
  alias: {
    common: fileURLToPath(new URL("./src/common", import.meta.url))
  },
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Markit",
    description: "Bookmarks, organized your way.",
    minimum_chrome_version: "116",
    action: {
      default_title: "Open Markit"
    },
    commands: {
      "open-panel": {
        suggested_key: {
          default: "Ctrl+Shift+K",
          mac: "Command+Shift+K"
        },
        description: "Open Markit and focus search"
      }
    },
    permissions: ["bookmarks", "favicon", "storage", "tabs", "tabGroups"]
  },
  vite: () => ({
    plugins: [tailwindcss()]
  })
})
