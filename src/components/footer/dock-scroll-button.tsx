import { IconButton as AstryxIconButton } from "@astryxdesign/core/IconButton"
import { cn } from "common/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"

import type { DockScrollDirection } from "~/hooks/use-dock-edge-scroll"

export function DockScrollButton({
  direction,
  isVisible,
  onClick,
  onHoverStart,
  onHoverEnd
}: {
  direction: DockScrollDirection
  isVisible: boolean
  onClick: () => void
  onHoverStart: () => void
  onHoverEnd: () => void
}) {
  const isLeft = direction === -1
  const label = isLeft ? "Scroll workspaces left" : "Scroll workspaces right"
  const Icon = isLeft ? ChevronLeft : ChevronRight

  return (
    <AstryxIconButton
      label={label}
      tooltip={label}
      variant="ghost"
      className={cn(
        "shrink-0 text-gray-500 dark:text-gray-400",
        !isVisible && "invisible"
      )}
      icon={<Icon aria-hidden="true" size={18} />}
      onClick={onClick}
      onPointerEnter={onHoverStart}
      onPointerLeave={onHoverEnd}
      onPointerCancel={onHoverEnd}
    />
  )
}
