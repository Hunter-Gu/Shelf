import { cn } from "common/lib/utils"
import { Button } from "@astryxdesign/core/Button"
import { Popover } from "@astryxdesign/core/Popover"
import { TextInput } from "@astryxdesign/core/TextInput"
import { lazy, Suspense, useState } from "react"

import { useAppContext } from "~/app/app-context"
import type { Workspace, WorkspaceHue } from "~/workspace-model"

import { ColorPicker } from "./color-picker"
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
    <Popover
      isOpen={open}
      onOpenChange={setOpen}
      label="Choose workspace emoji"
      width="min(20rem, calc(100vw - 1rem))"
      content={
        <div className={cn("w-full p-0", styles.picker)}>
          <Suspense fallback={<div className="h-80 w-full" />}>
            <EmojiPicker onEmojiSelect={handleSelect} />
          </Suspense>
        </div>
      }>
      <Button
        label="Choose workspace emoji"
        variant="ghost"
        className={className}>
          {emoji ? (
            <EmojiText style={{ fontSize: "1em" }}>{emoji}</EmojiText>
          ) : (
            <EmojiPlaceholder />
          )}
      </Button>
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
  const [color, setColor] = useState<WorkspaceHue | undefined>(workspace?.color)

  const { update, create } = useAppContext().workspace

  const handleSubmit = async () => {
    if (name.trim()) {
      if (isUpdating) {
        await update(workspace.id, (item) => {
          item.title = name
          item.logo = emoji
          item.color = color
        })
      } else {
        const created = await create({
          title: name,
          logo: emoji,
          color
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
        <TextInput
          label="Workspace name"
          isLabelHidden
          hasAutoFocus
          type="text"
          placeholder="Space name..."
          value={name}
          onChange={(value) => setName(value)}
          isRequired
          className="pl-2"
        />

        <ColorPicker value={color} onChange={setColor} />
      </Form>

      <ActionButtonsContainer>
        <ConfirmButton
          type="submit"
          label={isUpdating ? "Update Space" : "Create Space"}
          variant="primary"
          onClick={handleSubmit}
          isDisabled={!name}
        />
        <CancelButton label="Cancel" variant="ghost" onClick={onCancel} />
      </ActionButtonsContainer>
    </>
  )
}
