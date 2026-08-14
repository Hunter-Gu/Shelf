import {
  Menubar as _Menubar,
  MenubarCheckboxItem as _MenubarCheckboxItem,
  MenubarContent as _MenubarContent,
  MenubarSubContent as _MenubarSubContent,
  MenubarTrigger as _MenubarTrigger
} from "common/ui/menubar"

import { clsx, withClsx } from "../clsx"

export const Menubar = withClsx(
  _Menubar,
  "h-6 p-y border-none shadow-none bg-transparent"
)
export const MenubarContent = withClsx(_MenubarContent, "w-56")
export const MenubarSubContent = withClsx(_MenubarSubContent, "w-30")
export const MenubarTrigger = withClsx(
  _MenubarTrigger,
  "p-1 -mx-1 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
)
export const Text = clsx.span("text-ellipsis text-nowrap overflow-hidden")
export const MenubarCheckboxItem = withClsx(
  _MenubarCheckboxItem,
  "text-ellipsis text-nowrap overflow-hidden"
)
