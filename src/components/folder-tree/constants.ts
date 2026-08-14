import { DnDMode } from "../../context/dnd-context"
import styles from "./folder-tree.module.css"

export const FocusedStyle = "bg-black/10 dark:bg-white/10"

const appendBeforeStyle = styles.appendBefore
const appendStyle = styles.append
const insertStyle = "bg-gray-200 dark:bg-gray-800"
export const getDnDStyle = (isOver: boolean, mode: DnDMode) =>
  isOver
    ? mode === DnDMode.Append
      ? appendStyle
      : mode === DnDMode.Insert
        ? insertStyle
        : mode === DnDMode.AppendBefore
          ? appendBeforeStyle
          : ""
    : ""
