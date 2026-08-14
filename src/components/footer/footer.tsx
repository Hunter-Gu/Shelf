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
        {workspaces.map((space) => (
          <SpaceItem key={space.id} workspace={space}>
            <AstryxIconButton
              key={space.id}
              label={space.title}
              variant="ghost"
              className="h-7 w-7 rounded-md"
              icon={
                <span
                  className={cn(
                    !space.logo && "h-2 w-2 rounded-full",
                    !space.logo &&
                      (space.id === current.id
                        ? "bg-black/30 dark:bg-white/30"
                        : "bg-black/10 dark:bg-white/10"),
                    space.logo &&
                      (space.id === current.id ? "grayscale-0" : "grayscale")
                  )}>
                  {space.logo}
                </span>
              }
              onClick={() => {
                switchTo(space.id)
                onSwitchSpace()
              }} />
          </SpaceItem>
        ))}
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
