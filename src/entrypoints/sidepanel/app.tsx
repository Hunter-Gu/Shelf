import { AppProvider, useAppContext } from "~/app/app-context"
import { Theme as AstryxTheme } from "@astryxdesign/core/theme"
import { neutralTheme } from "@astryxdesign/theme-neutral/built"
import { CreateWorkspace } from "~/components/create-workspace"
import { Footer } from "~/components/footer/footer"
import { EditableProvider } from "~/context/editable-context"
import { CurrentTabBookmarkProvider } from "~/context/tab-bookmark-context"
import { VirtualTreeProvider } from "~/context/virtual-tree-context"
import { cn } from "common/lib/utils"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { useState } from "react"

import { Sidebar } from "~/sidebar"
import { createWorkspace, type Workspace } from "~/workspace-model"

function AppContent() {
  const { bookmarks, theme } = useAppContext()
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace>()

  return (
    <div className={cn("flex h-screen w-full flex-col", theme)}>
      {editingWorkspace ? (
        <CreateWorkspace
          workspace={editingWorkspace}
          onConfirm={() => setEditingWorkspace(undefined)}
          onCancel={() => setEditingWorkspace(undefined)}
        />
      ) : (
        <Sidebar onEdit={(nextWorkspace) => setEditingWorkspace(nextWorkspace)} />
      )}

      <Footer
        isEditingWorkspace={!!editingWorkspace}
        onCreateNewSpace={() =>
          setEditingWorkspace(
            createWorkspace({
              id: "",
              title: "",
              logo: ""
            })
          )
        }
        onSwitchSpace={() => {
          void bookmarks.search("")
          setEditingWorkspace(undefined)
        }}
      />
    </div>
  )
}

export default function App() {
  return (
    <AstryxTheme theme={neutralTheme} mode="system">
      <AppProvider>
        <CurrentTabBookmarkProvider>
          <VirtualTreeProvider>
            <EditableProvider>
              <DndProvider backend={HTML5Backend}>
                <AppContent />
              </DndProvider>
            </EditableProvider>
          </VirtualTreeProvider>
        </CurrentTabBookmarkProvider>
      </AppProvider>
    </AstryxTheme>
  )
}
