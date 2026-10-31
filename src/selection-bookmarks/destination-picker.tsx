import { Button } from "@astryxdesign/core/Button"
import {
  Popover,
  type PopoverTriggerRenderProps
} from "@astryxdesign/core/Popover"
import { TextInput } from "@astryxdesign/core/TextInput"
import { TreeList, type TreeListItemData } from "@astryxdesign/core/TreeList"
import { Check, ChevronDown, Folder, PanelsTopLeft, Search } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

import type { BookmarkDestination } from "./destinations"
import { GET_DESTINATIONS, type DestinationsResult } from "./messages"
import { requestBackground } from "./request-background"

export type ChosenDestination = { id: string; path: string; title: string }
type Props = {
  visible: boolean
  busy: boolean
  onReady: (destination?: ChosenDestination) => void
  onChoose: () => void
  onOpenChange: (open: boolean) => void
}

export function DestinationPicker({
  visible,
  busy,
  onReady,
  onChoose,
  onOpenChange
}: Props) {
  const [folders, setFolders] = useState<BookmarkDestination[]>([])
  const [selectedId, setSelectedId] = useState<string>()
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [open, setOpen] = useState(false)
  const [reload, setReload] = useState(0)
  const setIsOpen = useCallback(
    (value: boolean) => {
      setOpen(value)
      onOpenChange(value)
    },
    [onOpenChange]
  )
  useEffect(() => {
    let stopped = false
    void requestBackground<DestinationsResult>({ type: GET_DESTINATIONS })
      .then((result) => {
        if (stopped) return
        if (!result.ok) throw new Error(result.error)
        setFolders(result.folders)
        setSelectedId(result.destinationId)
        const folder = result.folders.find(
          (item) => item.id === result.destinationId
        )
        onReady(
          folder
            ? { id: folder.id, path: folder.path, title: folder.title }
            : undefined
        )
      })
      .catch((problem: unknown) => {
        if (!stopped)
          setError(
            problem instanceof Error
              ? problem.message
              : "Could not load folders."
          )
      })
      .finally(() => {
        if (!stopped) setLoading(false)
      })
    return () => {
      stopped = true
    }
  }, [onReady, reload])

  const selected = folders.find((item) => item.id === selectedId)
  const search = query.trim().toLocaleLowerCase()
  const choose = (folder: BookmarkDestination) => {
    const changed = folder.id !== selectedId
    setSelectedId(folder.id)
    onReady({ id: folder.id, path: folder.path, title: folder.title })
    setIsOpen(false)
    if (changed) onChoose()
  }
  const expanded = new Set<string>()
  let parent = selected?.parentId
  while (parent) {
    expanded.add(parent)
    parent = folders.find((item) => item.id === parent)?.parentId
  }
  const item = (folder: BookmarkDestination): TreeListItemData => {
    const children = search
      ? []
      : folders.filter((child) => child.parentId === folder.id)
    return {
      id: folder.id,
      label: (
        <span title={folder.path}>{search ? folder.path : folder.title}</span>
      ),
      startContent:
        folder.kind === "space" ? (
          <PanelsTopLeft size={14} />
        ) : (
          <Folder size={14} />
        ),
      endContent: folder.id === selectedId ? <Check size={13} /> : undefined,
      isSelected: folder.id === selectedId,
      isExpanded: expanded.has(folder.id),
      onClick: () => choose(folder),
      children: children.length ? children.map(item) : undefined
    }
  }
  const items = (
    search
      ? folders.filter((folder) =>
          folder.path.toLocaleLowerCase().includes(search)
        )
      : folders.filter((folder) => !folder.parentId)
  ).map(item)
  return (
    <Popover
      isOpen={visible && !busy && open}
      onOpenChange={setIsOpen}
      label="Save page to"
      width="min(280px, calc(100vw - 16px))"
      className="destination-content"
      hasCloseButton={false}
      content={
        <div className="destination-content-layout">
          <TextInput
            label="Search spaces or folders"
            isLabelHidden
            placeholder="Search spaces or folders"
            size="sm"
            value={query}
            onChange={setQuery}
            startIcon={Search}
          />
          {loading ? (
            <p role="status">Loading folders…</p>
          ) : error ? (
            <div role="alert">
              <p>{error}</p>
              <Button
                label="Retry"
                size="sm"
                onClick={() => {
                  setLoading(true)
                  setError("")
                  onReady()
                  setReload((value) => value + 1)
                }}
              />
            </div>
          ) : items.length ? (
            <TreeList
              key={search ? "search" : selectedId}
              aria-label="Spaces and folders"
              className="destination-tree"
              items={items}
              density="compact"
              variant="noGuides"
            />
          ) : (
            <p role="status">No matching folders.</p>
          )}
        </div>
      }>
      {(trigger) => (
        <DestinationTrigger
          {...trigger}
          busy={busy}
          title={selected?.path}
          name={loading ? "Loading…" : (selected?.title ?? "Choose folder")}
        />
      )}
    </Popover>
  )
}

function DestinationTrigger({
  busy,
  name,
  title,
  onClick,
  ...trigger
}: {
  busy: boolean
  name: string
  title?: string
} & PopoverTriggerRenderProps) {
  return (
    <Button
      {...trigger}
      onClick={onClick}
      label="Choose where to save the page"
      tooltip={title}
      size="sm"
      variant="ghost"
      isDisabled={busy}
      icon={<Folder size={14} />}
      endContent={<ChevronDown size={10} />}
      className="destination-trigger">
      <span className="destination-name">{name}</span>
    </Button>
  )
}
