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

export const workspaceName = {
  home: HOME_NAME,
  isValid(folderTitle: string) {
    return WORKSPACE_NAME_PATTERN.test(folderTitle)
  },
  isHome(folderTitle: string) {
    return parse(folderTitle).isHome
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
