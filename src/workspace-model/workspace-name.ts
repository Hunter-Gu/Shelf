import { formatShelfTitle, parseShelfTitle } from "~/shelf-title"

const HOME_NAME = "Home"

// Home is identified by the "Home" role in the generated marker rather than by
// its name, so the name stays the user's to change and no typed name can ever
// impersonate it. Shelf folders with any other role (pins, favorites) are not
// workspaces.
function parse(folderTitle: string) {
  const parsed = parseShelfTitle(folderTitle)
  const isWorkspace =
    !!parsed && (parsed.role === undefined || parsed.role === "Home")

  return {
    isWorkspace,
    logo: isWorkspace ? parsed.logo : "",
    title: isWorkspace ? parsed.name : folderTitle.trim(),
    isHome: isWorkspace && parsed.role === "Home"
  }
}

function isTaken(title: string, takenTitles: string[]) {
  const wanted = title.trim().toLowerCase()
  return takenTitles.some((taken) => taken.trim().toLowerCase() === wanted)
}

export const workspaceName = {
  home: HOME_NAME,
  isValid(folderTitle: string) {
    return parse(folderTitle).isWorkspace
  },
  isHome(folderTitle: string) {
    return parse(folderTitle).isHome
  },
  // Names are what a workspace is recovered by when its bookmark id stops
  // resolving, so two workspaces sharing one would make that ambiguous. The
  // comparison ignores case and padding to keep near-duplicates out too.
  isTaken,
  // For entry points with nowhere to show an error — turning an existing
  // folder into a space — where refusing would just look broken.
  disambiguate(title: string, takenTitles: string[]) {
    const wanted = title.trim()
    let candidate = wanted
    let suffix = 2
    while (isTaken(candidate, takenTitles)) {
      candidate = `${wanted} ${suffix}`
      suffix += 1
    }
    return candidate
  },
  parse(folderTitle: string) {
    return parse(folderTitle).title
  },
  parseLogo(folderTitle: string) {
    return parse(folderTitle).logo
  },
  format(title: string, logo = "") {
    return formatShelfTitle(title, { logo })
  },
  formatHome(title: string, logo = "") {
    return formatShelfTitle(title, { logo, role: "Home" })
  }
}
