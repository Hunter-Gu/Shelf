import { type ChangeEvent, useCallback } from "react"

import { useAppContext } from "~/app/app-context"

export function useSearch() {
  const { bookmarks } = useAppContext()

  const handleSearch = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const text = event.target.value
      void bookmarks.search(text)
    },
    [bookmarks]
  )

  return {
    searchText: bookmarks.searchState?.text ?? "",
    handleSearch
  }
}
