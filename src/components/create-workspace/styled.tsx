import { Button } from "@astryxdesign/core/Button"
import { UserRoundPenIcon } from "lucide-react"

import { clsx, withClsx } from "../clsx"

export const EmojiContainer = clsx.div(`flex justify-center mt-3 mb-6 px-3`)

export const SpaceTitle = clsx.h2("text-2xl font-bold text-center mb-2")

export const SpaceDesc = clsx.p(
  "text-gray-600 dark:text-gray-300 text-center mb-6"
)

export const Form = clsx.div("space-y-4 px-3")

export const ActionButtonsContainer = clsx.div(
  "flex flex-col gap-1 pt-4 mt-auto mb-4 px-3"
)

export const ConfirmButton = withClsx(
  Button,
  "font-semibold"
)

export const CancelButton = withClsx(
  Button,
  "text-black/50 dark:text-white/60"
)

const EmojiStyle = "w-full h-full"
export const EmojiText = clsx.span(EmojiStyle)
export const EmojiPlaceholder = withClsx(UserRoundPenIcon, EmojiStyle)
