import js from "@eslint/js"
import reactHooks from "eslint-plugin-react-hooks"
import { defineConfig, globalIgnores } from "eslint/config"
import globals from "globals"
import tseslint from "typescript-eslint"

export default defineConfig([
  globalIgnores([".output/**", ".wxt/**", "**/node_modules/**"]),
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["**/*.d.ts"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser
    },
    rules: {
      // These are React Compiler rules; Shelf doesn't use the compiler, and
      // react-dnd connects refs during render by design.
      "react-hooks/refs": "off",
      "react-hooks/incompatible-library": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ]
    }
  }
])
