import { cn } from "common/lib/utils"
import { createElement, forwardRef, type ComponentType } from "react"

const NODES = [
  "a",
  "button",
  "div",
  "form",
  "h2",
  "h3",
  "img",
  "input",
  "label",
  "li",
  "nav",
  "ol",
  "p",
  "span",
  "svg",
  "ul"
] as const

type Clsx = Record<
  (typeof NODES)[number],
  (className: string) => ComponentType<any>
>

export const clsx = NODES.reduce((acc, node) => {
  const Node = forwardRef<any, any>((props, ref) =>
    createElement(node, { ...props, ref })
  )
  Node.displayName = `clsx.${node}`
  return { ...acc, [node]: (className: string) => withClsx(Node, className) }
}, {} as Clsx)

export function withClsx(Comp: ComponentType<any>, presetClassName = "") {
  const Component = forwardRef<any, any>(({ className, ...props }, ref) => (
    <Comp className={cn(presetClassName, className)} ref={ref} {...props} />
  ))
  Component.displayName = `withClsx(${Comp.displayName || Comp.name || "Component"})`
  return Component
}
