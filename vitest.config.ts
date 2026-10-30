import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./src", import.meta.url)),
      common: fileURLToPath(new URL("./src/common", import.meta.url))
    }
  },
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"]
  }
})
