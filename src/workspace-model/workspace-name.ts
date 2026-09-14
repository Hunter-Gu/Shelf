// The optional "Home" marker is what identifies Home's folder. It lives in the
// generated suffix rather than in the name, so the name stays the user's to
// change and no typed name can ever impersonate it.
const WORKSPACE_NAME_PATTERN =
  /^(?:\[([^\]]*)\]\s*)?(.*?)\s*\((Home )?Workspace\)\s*$/
const HOME_NAME = "Home"

function parse(folderTitle: string) {
  const match = WORKSPACE_NAME_PATTERN.exec(folderTitle)
  return {
    logo: match?.[1]?.trim() ?? "",
    title: match?.[2]?.trim() ?? folderTitle.trim(),
    isHome: !!match?.[3]
  }
}

function isTaken(title: string, takenTitles: string[]) {
  const wanted = title.trim().toLowerCase()
  return takenTitles.some((taken) => taken.trim().toLowerCase() === wanted)
}

export const workspaceName = {
  home: HOME_NAME,
  isValid(folderTitle: string) {
    return WORKSPACE_NAME_PATTERN.test(folderTitle)
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
    const profile = logo.trim() ? `[${logo.trim()}] ` : ""
    return `${profile}${title.trim()} (Workspace)`
  },
  formatHome(title: string, logo = "") {
    const profile = logo.trim() ? `[${logo.trim()}] ` : ""
    return `${profile}${title.trim()} (Home Workspace)`
  }
}
