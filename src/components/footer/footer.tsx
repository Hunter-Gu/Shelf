import { IconButton as AstryxIconButton } from "@astryxdesign/core/IconButton"
import { cn } from "common/lib/utils"
import { Reorder } from "framer-motion"
import { Plus } from "lucide-react"
import { useRef } from "react"

import { useAppContext } from "~/app/app-context"
import { useDockEdgeScroll } from "~/hooks/use-dock-edge-scroll"
import { useWheelToHorizontalScroll } from "~/hooks/use-wheel-to-horizontal-scroll"

import { clsx } from "../clsx"
import { DockScrollButton } from "./dock-scroll-button"
import styles from "./footer.module.css"
import { SettingsMenu } from "./settings-menu"
import { SpaceDockButton } from "./space-dock-button"
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
  const dockRef = useRef<HTMLUListElement>(null)
  useWheelToHorizontalScroll(dockRef)
  const dockScroll = useDockEdgeScroll(dockRef, workspaces.length)

  return (
    <FooterContainer className={cn(isEditingWorkspace ? "mt-0" : "mt-auto")}>
      <div className="shrink-0">
        <SettingsMenu />
      </div>

      <DockScrollButton
        direction={-1}
        isVisible={dockScroll.canScrollLeft}
        onClick={() => dockScroll.scrollOnce(-1)}
        onHoverStart={() => dockScroll.startHoverScroll(-1)}
        onHoverEnd={dockScroll.stopHoverScroll}
      />

      <Reorder.Group
        ref={dockRef}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-1 px-3",
          styles.dock
        )}
        axis="x"
        onReorder={(newOrder) => {
          reorder(newOrder)
        }}
        values={workspaces}>
        {workspaces.map((space) => {
          const isActive = space.id === current.id
          return (
            <SpaceItem key={space.id} workspace={space} className="shrink-0">
              <SpaceDockButton
                space={space}
                isActive={isActive}
                onClick={() => {
                  switchTo(space.id)
                  onSwitchSpace()
                }}
              />
            </SpaceItem>
          )
        })}
      </Reorder.Group>

      <DockScrollButton
        direction={1}
        isVisible={dockScroll.canScrollRight}
        onClick={() => dockScroll.scrollOnce(1)}
        onHoverStart={() => dockScroll.startHoverScroll(1)}
        onHoverEnd={dockScroll.stopHoverScroll}
      />

      <AstryxIconButton
        label="Create workspace"
        tooltip="Create workspace"
        variant="ghost"
        className="shrink-0"
        isDisabled={!ready}
        icon={<Plus size={20} className="text-gray-600 dark:text-gray-300" />}
        onClick={onCreateNewSpace}
      />
    </FooterContainer>
  )
}
