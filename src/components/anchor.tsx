import type { AnchorHTMLAttributes, MouseEventHandler } from "react"

import { tabManager } from "~/tabs/actions"

export type AnchorProps = Pick<
  AnchorHTMLAttributes<Element>,
  | "href"
  | "children"
  | "className"
  | "target"
  | "title"
  | "aria-label"
  | "aria-current"
>

export function Anchor({ children, ...props }: AnchorProps) {
  return <MockAnchor {...props}>{children}</MockAnchor>
}

function MockAnchor({ children, href, target, ...rest }: AnchorProps) {
  const handleClick: MouseEventHandler = (e) => {
    if (!href) return

    if (target === "_blank" || e.ctrlKey || e.metaKey) {
      void tabManager.create({
        url: href,
        active: false
      })
    } else {
      void tabManager.switchToOrOpen(href)
    }
  }
  return (
    <button role="link" {...rest} onClick={handleClick}>
      {children}
    </button>
  )
}
