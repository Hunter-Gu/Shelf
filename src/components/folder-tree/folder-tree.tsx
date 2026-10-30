import { FolderStatesProvider } from "common/context/folder-states-context"
import { cn } from "common/lib/utils"
import { useRef } from "react"

import type { Folder } from "~/bookmark-model"
import { useWorkspaceRootDrop } from "~/components/bookmark-dnd"

import { clsx, withClsx } from "../clsx"
import styles from "./folder-tree.module.css"
import { VirtualTree as _VirtualTree } from "./virtual-tree"

type FolderTreeProps = {
  tree?: Folder | null
}

const TreeContainer = clsx.div(
  cn("min-h-0 flex-1 overflow-y-hidden pb-10 px-3", styles.folderTree)
)
const VirtualTree = withClsx(
  _VirtualTree,
  cn("h-full overflow-x-hidden", styles.folderTree)
)

export function FolderTree({ tree }: FolderTreeProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { drop, isOver } = useWorkspaceRootDrop(ref)
  drop(ref)

  return (
    <FolderStatesProvider>
      {tree ? (
        <TreeContainer
          ref={ref}
          className={cn(isOver && "bg-black/[0.025] dark:bg-white/[0.025]")}>
          <VirtualTree tree={tree} />
        </TreeContainer>
      ) : null}
    </FolderStatesProvider>
  )
}
