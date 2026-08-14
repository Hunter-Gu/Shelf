import {
  BookmarkCheckIcon as _BookmarkCheckIcon,
  BookmarkPlusIcon as _BookmarkPlusIcon,
  FileInputIcon as _FileInputIcon
} from "lucide-react"

import { clsx, withClsx } from "../clsx"

const ICON_STYLE = "h-4 w-4"
export const BookmarkCheckIcon = withClsx(_BookmarkCheckIcon, ICON_STYLE)
export const BookmarkPlusIcon = withClsx(_BookmarkPlusIcon, ICON_STYLE)
export const FileInputIcon = withClsx(_FileInputIcon, ICON_STYLE)
