import { TextInput } from "@astryxdesign/core/TextInput"
import { useState } from "react"

import { useAppContext } from "~/app/app-context"
import {
  workspaceName,
  type Workspace,
  type WorkspaceHue
} from "~/workspace-model"

import { EmojiButton } from "../emoji-button"
import { ColorPicker } from "./color-picker"
import {
  ActionButtonsContainer,
  CancelButton,
  ConfirmButton,
  EmojiContainer,
  Form,
  SpaceDesc,
  SpaceTitle
} from "./styled"

interface CreateWorkspaceProps {
  workspace?: Workspace
  onConfirm: () => void
  onCancel: () => void
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

  const { update, create, workspaces } = useAppContext().workspace
  const isNameTaken = workspaceName.isTaken(
    name,
    workspaces
      .filter((item) => item.id !== workspace?.id)
      .map((item) => item.title)
  )

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
          className="w-14 h-14 mt-8 text-4xl"
          label="Choose workspace emoji"
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
          status={
            isNameTaken
              ? {
                  type: "error",
                  message: `"${name.trim()}" is already a space`
                }
              : undefined
          }
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
          isDisabled={!name.trim() || isNameTaken}
        />
        <CancelButton label="Cancel" variant="ghost" onClick={onCancel} />
      </ActionButtonsContainer>
    </>
  )
}
