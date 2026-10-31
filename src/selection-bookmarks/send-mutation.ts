import {
  SAVE_HIGHLIGHT,
  type HighlightMutation,
  type MutationResult
} from "./messages"
import { requestBackground } from "./request-background"

export async function sendHighlightMutation(message: HighlightMutation) {
  const result = await requestBackground<MutationResult>(message)
  if (!result.ok) throw new Error(result.error)
  if (message.type === SAVE_HIGHLIGHT && !result.highlight?.id)
    throw new Error(
      "Shelf did not return a saved bookmark. Reload the extension and refresh this page."
    )
  return result
}
