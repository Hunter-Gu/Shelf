import { cn } from "common/lib/utils"

import { WORKSPACE_HUES, type WorkspaceHue } from "~/workspace-model"

type ColorPickerProps = {
  value?: WorkspaceHue
  onChange: (hue: WorkspaceHue) => void
}

// The theme's --color-icon-{hue} tokens are deliberately darkened for
// icon-on-light-surface contrast, so they don't read as their hue name in a
// swatch (e.g. "pink" renders as wine, "orange" as brown). These are the
// saturated source hues the theme's whole ramp is derived from — true to
// the name, used for the picker swatches only; everywhere else still
// resolves color from the theme tokens so contrast stays correct per mode.
const SWATCH_PREVIEW: Record<WorkspaceHue, string> = {
  gray: "#8a8a8a",
  red: "#eb183a",
  orange: "#d57113",
  yellow: "#f8c723",
  green: "#358a3a",
  teal: "#0c7365",
  cyan: "#0c6f82",
  blue: "#0074e2",
  purple: "#980fb2",
  pink: "#b10e69"
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const selected = value ?? "gray"

  return (
    <div
      role="radiogroup"
      aria-label="Workspace color"
      className="flex flex-wrap gap-2 px-2">
      {WORKSPACE_HUES.map((hue) => {
        const isSelected = selected === hue
        const preview = SWATCH_PREVIEW[hue]
        return (
          <button
            key={hue}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={hue}
            onClick={() => onChange(hue)}
            className={cn(
              "h-6 w-6 rounded-full transition-transform",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
              isSelected ? "scale-110" : "hover:scale-105 opacity-80 hover:opacity-100"
            )}
            style={{
              backgroundColor: preview,
              boxShadow: isSelected
                ? `0 0 0 2px var(--color-background-surface), 0 0 0 4px ${preview}`
                : undefined
            }}
          />
        )
      })}
    </div>
  )
}
