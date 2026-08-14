import { useEffect, useState } from "react"

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    const matcher = window.matchMedia("(prefers-color-scheme: dark)")
    const update = () => setTheme(matcher.matches ? "dark" : "light")
    update()
    matcher.addEventListener("change", update)
    return () => matcher.removeEventListener("change", update)
  }, [])

  return theme
}
