import { storage } from "wxt/utils/storage"

import {
  DEFAULT_SELECTION_PREFERENCES,
  selectionPreferences,
  type SelectionPreferences
} from "./preferences"

const item = storage.defineItem<SelectionPreferences>(
  "sync:selectionBookmarks",
  { fallback: DEFAULT_SELECTION_PREFERENCES }
)

export const selectionPreferencesStorage = {
  async getValue() {
    return selectionPreferences(await item.getValue())
  },
  setValue(value: SelectionPreferences) {
    return item.setValue(selectionPreferences(value))
  },
  watch(callback: (value: SelectionPreferences) => void) {
    return item.watch((value) => callback(selectionPreferences(value)))
  }
}
