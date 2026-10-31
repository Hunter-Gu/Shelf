import { registerIcons } from "@astryxdesign/core/Icon"
import { ThemeContext } from "@astryxdesign/core/theme"
import { neutralTheme } from "@astryxdesign/theme-neutral/built"
import type { PropsWithChildren } from "react"

const theme = { theme: neutralTheme, mode: "system" as const }
if (neutralTheme.icons) registerIcons(neutralTheme.icons)

export function ShadowTheme({ children }: PropsWithChildren) {
  // Theme also changes <html>; only theme the injected shadow tree here.
  return (
    <ThemeContext value={theme}>
      <div data-astryx-theme={neutralTheme.name} className="shelf-theme">
        {children}
      </div>
    </ThemeContext>
  )
}
