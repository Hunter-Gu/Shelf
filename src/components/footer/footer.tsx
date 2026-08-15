import { cn } from "common/lib/utils"
import { IconButton as AstryxIconButton } from "@astryxdesign/core/IconButton"
import { Reorder } from "framer-motion"
import { Keyboard, Plus } from "lucide-react"
import { browser } from "wxt/browser"

import { useAppContext } from "~/app/app-context"

import { clsx } from "../clsx"
import styles from "./footer.module.css"
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

  return (
    <FooterContainer className={cn(isEditingWorkspace ? "mt-0" : "mt-auto")}>
      <AstryxIconButton
        label="Keyboard shortcuts"
        tooltip="Keyboard shortcuts"
        variant="ghost"
        className="shrink-0"
        icon={<Keyboard size={18} className="text-gray-500 dark:text-gray-400" />}
        onClick={() => {
          void browser.tabs.create({ url: "chrome://extensions/shortcuts" })
        }}
      />

      <Reorder.Group
        className={cn(
          "flex min-w-0 flex-1 items-center justify-center gap-1 px-3",
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
