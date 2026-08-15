import { cn } from "common/lib/utils"
import { IconButton as AstryxIconButton } from "@astryxdesign/core/IconButton"
import { useState } from "react"

import type { Workspace } from "~/workspace-model"

type SpaceDockButtonProps = {
  space: Workspace
  isActive: boolean
  onClick: () => void
}

export function SpaceDockButton({ space, isActive, onClick }: SpaceDockButtonProps) {
  const [isFocused, setIsFocused] = useState(false)
  const hue = space.color ?? "gray"

  // The default focus outline traces the button's real box, which doesn't
  // always match the intended 28px circle (Astryx's own unlayered button
  // styles can win over the size/radius set here) — showing focus as a
  // background tint instead sidesteps that regardless of the button's
  // actual box.
  const backgroundColor = isActive
    ? `var(--color-background-${hue})`
    : isFocused
      ? "var(--color-overlay-hover, rgba(0, 0, 0, 0.08))"
      : undefined

  return (
    <AstryxIconButton
      label={space.title}
      tooltip={space.title}
      variant="ghost"
      className="transition-colors duration-200"
      style={{
        width: "1.75rem",
        height: "1.75rem",
        borderRadius: "9999px",
        outline: "none",
        backgroundColor
      }}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      icon={
        <span
          className={cn(
            !space.logo && "h-2 w-2 rounded-full",
            space.logo && (isActive ? "grayscale-0" : "grayscale opacity-60")
          )}
          style={
            !space.logo
              ? {
                  backgroundColor: `var(--color-icon-${hue})`,
                  opacity: isActive ? 1 : 0.45
                }
              : undefined
          }>
          {space.logo}
        </span>
      }
      onClick={onClick}
    />
  )
}
