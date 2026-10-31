import { browser } from "wxt/browser"

export function requestBackground<T>(message: { type: string }): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () =>
        reject(
          new Error(
            "Shelf did not respond. Reload the extension, refresh this page, and try again."
          )
        ),
      10000
    )
    try {
      browser.runtime.sendMessage(message, (result: T | undefined) => {
        clearTimeout(timeout)
        const error = browser.runtime.lastError?.message
        if (error) reject(new Error(error))
        else if (result === undefined)
          reject(
            new Error("Shelf did not respond. Refresh this page and try again.")
          )
        else resolve(result)
      })
    } catch (error) {
      clearTimeout(timeout)
      reject(error)
    }
  })
}
