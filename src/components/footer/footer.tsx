import { cn } from "common/lib/utils"
import { IconButton as AstryxIconButton } from "@astryxdesign/core/IconButton"
import { Reorder } from "framer-motion"
import { Plus } from "lucide-react"

import { useAppContext } from "~/app/app-context"

import { clsx } from "../clsx"
import styles from "./footer.module.css"
import { SpaceItem } from "./space-item"

const FooterContainer = clsx.div(
  "flex justify-between items-center px-3 py-4 border-t border-solid border-t-black/10 dark:border-t-white/10"
)
export function Footer({
  isEditingWorkspace,
  onCreateNewSpace,
  onSwitchSpace
}: {
  isEditingWorkspace: boolean
  onCreateNewSpace: () => void
  onSwitchSpace: () => void
}) {
  const { workspace } = useAppContext()
  const { workspaces, currentWorkspace: current, ready, reorder } = workspace
  const switchTo = workspace.switch

  return (
    <FooterContainer
      className={cn(isEditingWorkspace ? "mt-0" : "mt-auto", styles.container)}>
      <div></div>

      <Reorder.Group
        className="flex gap-1 items-center"
        axis="x"
        onReorder={(newOrder) => {
          reorder(newOrder)
        }}
        values={workspaces}>
        {workspaces.map((space) => {
          const isActive = space.id === current.id
          const hue = space.color ?? "gray"
          return (
            <SpaceItem key={space.id} workspace={space}>
              <AstryxIconButton
                key={space.id}
                label={space.title}
                variant="ghost"
                className="h-7 w-7 rounded-full transition-colors duration-200"
                style={
                  isActive
                    ? { backgroundColor: `var(--color-background-${hue})` }
                    : undefined
                }
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
                onClick={() => {
                  switchTo(space.id)
                  onSwitchSpace()
                }} />
            </SpaceItem>
          )
        })}
      </Reorder.Group>

      <AstryxIconButton
        label="Create workspace"
        variant="ghost"
        isDisabled={!ready}
        icon={<Plus size={20} className="text-gray-600 dark:text-gray-300" />}
        onClick={onCreateNewSpace}
      />
    </FooterContainer>
  )
}
