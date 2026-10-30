import { Button } from "@astryxdesign/core/Button"
import { Popover } from "@astryxdesign/core/Popover"
import { cn } from "common/lib/utils"
import { UserRoundPenIcon } from "lucide-react"
import { lazy, Suspense, useState, type ReactNode } from "react"

import styles from "./emoji-button.module.css"

type EmojiButtonProps = {
  label: string
  className?: string
  emoji?: string
  placeholder?: ReactNode
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

export function EmojiButton({
  label,
  className,
  emoji,
  placeholder = <UserRoundPenIcon className="h-full w-full" />,
  onEmojiSelect
}: EmojiButtonProps) {
  const [open, setOpen] = useState(false)
  const handleSelect = ({ native }: { native: string }) => {
    onEmojiSelect?.(native)
    setOpen(false)
  }
  return (
    <Popover
      isOpen={open}
      onOpenChange={setOpen}
      label={label}
      width="min(20rem, calc(100vw - 1rem))"
      content={
        <div className={cn("w-full p-0", styles.picker)}>
          <Suspense fallback={<div className="h-80 w-full" />}>
            <EmojiPicker onEmojiSelect={handleSelect} />
          </Suspense>
        </div>
      }>
      <Button
        label={label}
        variant="ghost"
        className={className}
        style={emoji ? { padding: 0 } : undefined}>
        {emoji ? (
          <span className="h-full w-full" style={{ fontSize: "1em" }}>
            {emoji}
          </span>
        ) : (
          placeholder
        )}
      </Button>
    </Popover>
  )
}
