import { AppProvider, useAppContext } from "~/app/app-context"
import { CreateWorkspace } from "~/components/create-workspace"
import { Footer } from "~/components/footer/footer"
import { EditableProvider } from "~/context/editable-context"
import { CurrentTabBookmarkProvider } from "~/context/tab-bookmark-context"
import { VirtualTreeProvider } from "~/context/virtual-tree-context"
import { cn } from "common/lib/utils"
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
        <Sidebar onEdit={(_, nextWorkspace) => setEditingWorkspace(nextWorkspace)} />
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
    <AppProvider>
      <CurrentTabBookmarkProvider>
        <VirtualTreeProvider>
          <EditableProvider>
            <AppContent />
          </EditableProvider>
        </VirtualTreeProvider>
      </CurrentTabBookmarkProvider>
    </AppProvider>
  )
}
