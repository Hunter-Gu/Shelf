// Every folder Shelf owns ends in a generated "(Shelf)" marker, with its role
// after a bar when it isn't a plain workspace: "(Shelf|Home)", "(Shelf|Pins)".
// Only the last parenthesis counts, so a name that happens to contain the
// marker can't change what a folder is.
const SHELF_TITLE_PATTERN =
  /^(?:\[([^\]]*)\]\s*)?(.*?)\s*\(Shelf(?:\|([^|)]+))?\)\s*$/

export type ShelfRole = "Home" | "Pins" | "Favorites" | "Highlights"

export function parseShelfTitle(folderTitle: string) {
  const match = SHELF_TITLE_PATTERN.exec(folderTitle)
  if (!match) return null

  return {
    logo: match[1]?.trim() ?? "",
    name: match[2]?.trim() ?? "",
    role: match[3]?.trim()
  }
}

export function formatShelfTitle(
  name: string,
  { logo = "", role }: { logo?: string; role?: ShelfRole } = {}
) {
  const profile = logo.trim() ? `[${logo.trim()}] ` : ""
  return `${profile}${name.trim()} (Shelf${role ? `|${role}` : ""})`
}
