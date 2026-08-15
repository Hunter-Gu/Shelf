const WORKSPACE_NAME_PATTERN = /^(?:\[([^\]]*)\]\s*)?(.*?)\s*\(Workspace\)\s*$/

function parse(folderTitle: string) {
  const match = WORKSPACE_NAME_PATTERN.exec(folderTitle)
  return {
    logo: match?.[1]?.trim() ?? "",
    title: match?.[2]?.trim() ?? folderTitle.trim()
  }
}

export const workspaceName = {
  home: "Home",
  other: "Other",
  isValid(folderTitle: string) {
    return WORKSPACE_NAME_PATTERN.test(folderTitle)
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
  }
}
