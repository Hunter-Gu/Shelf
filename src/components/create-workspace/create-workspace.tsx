import { cn } from "common/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "common/ui/popover"
import { lazy, Suspense, useState, type ChangeEvent } from "react"

import { useAppContext } from "~/app/app-context"
import type { Workspace } from "~/workspace-model"

import { Input } from "../styled"
import styles from "./create-workspace.module.css"
import {
  ActionButtonsContainer,
  CancelButton,
  ConfirmButton,
  EmojiContainer,
  EmojiPlaceholder,
  EmojiText,
  Form,
  SpaceDesc,
  SpaceTitle
} from "./styled"

interface CreateWorkspaceProps {
  workspace?: Workspace
  onConfirm: () => void
  onCancel: () => void
}

type EmojiButtonProps = {
  className?: string
  emoji?: string
  onEmojiSelect?: (emoji: string) => void
}

type EmojiPickerProps = {
  onEmojiSelect: ({ native }: { native: string }) => void
}

const EmojiPicker = lazy(async () => {
  const [{ default: Picker }, { default: data }] = await Promise.all([
    import("@emoji-mart/react"),
    import("@emoji-mart/data")
  ])

  return {
    default: ({ onEmojiSelect }: EmojiPickerProps) => (
      <Picker dynamicWidth data={data} onEmojiSelect={onEmojiSelect} />
    )
  }
})

function EmojiButton({ className, emoji, onEmojiSelect }: EmojiButtonProps) {
  const [open, setOpen] = useState(false)
  const handleSelect = ({ native }: { native: string }) => {
    onEmojiSelect?.(native)
    setOpen(false)
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {/* <Button variant="outline">Open popover</Button> */}
        <button className={className}>
          {emoji ? (
            <EmojiText style={{ fontSize: "1em" }}>{emoji}</EmojiText>
          ) : (
            <EmojiPlaceholder />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("w-[min(20rem,calc(100vw-1rem))] p-0", styles.picker)}>
        <Suspense fallback={<div className="h-80 w-full" />}>
          <EmojiPicker onEmojiSelect={handleSelect} />
        </Suspense>
      </PopoverContent>
    </Popover>
  )
}

export function CreateWorkspace({
  workspace,
  onConfirm,
  onCancel
}: CreateWorkspaceProps) {
  const isUpdating = !!workspace?.id
  const [name, setName] = useState(workspace?.title || "")
  const [emoji, setEmoji] = useState(workspace?.logo || "")
  const [theme, setTheme] = useState(workspace?.theme || "")

  const { update, create } = useAppContext().workspace

  const handleSubmit = async () => {
    if (name.trim()) {
      if (isUpdating) {
        await update(workspace.id, (item) => {
          item.title = name
          item.logo = emoji
          item.theme = theme
        })
      } else {
        const created = await create({
          title: name,
          logo: emoji,
          theme
        })
        if (!created) return
      }
      onConfirm()
    }
  }

  return (
    <>
      <EmojiContainer>
        <EmojiButton
          className="w-10 h-10 mt-8  text-5xl"
          emoji={emoji}
          onEmojiSelect={setEmoji}
        />
      </EmojiContainer>
      <SpaceTitle>
        {isUpdating ? "Update a Space" : "Create a Space"}
      </SpaceTitle>
      <SpaceDesc>
        Separate your tabs for life, work, projects, and more.
      </SpaceDesc>

      <Form>
        {/* workspace */}
        <Input
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          type="text"
          placeholder="Space name..."
          defaultValue={name}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setName(e.target.value)
          }
          required
          className="pl-2"
        />

        {/* <Theme /> */}
      </Form>

      <ActionButtonsContainer>
        <ConfirmButton type="submit" onClick={handleSubmit} disabled={!name}>
          {isUpdating ? "Update Space" : "Create Space"}
        </ConfirmButton>
        <CancelButton variant="ghost" onClick={onCancel}>
          Cancel
        </CancelButton>
      </ActionButtonsContainer>
    </>
  )
}
