import type { ToolbarRect } from "./toolbar-view"

export function editable(node: Node | null) {
  const element = node instanceof Element ? node : node?.parentElement
  return (
    element instanceof HTMLElement &&
    (element.isContentEditable ||
      !!element.closest(
        "input, textarea, select, [role='textbox'], [role='searchbox']"
      ))
  )
}

export function selectionRect(selection: Selection): ToolbarRect {
  if (selection.focusNode) {
    const focus = document.createRange()
    focus.setStart(selection.focusNode, selection.focusOffset)
    focus.collapse(true)
    const rect = focus.getClientRects()[0] ?? focus.getBoundingClientRect()
    if (rect.height) return rect
  }
  return selection.getRangeAt(0).getBoundingClientRect()
}
