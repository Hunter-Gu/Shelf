import { useCallback } from "react"

import { useAppContext } from "~/app/app-context"

export function useSearch() {
  const { bookmarks } = useAppContext()

  const handleSearch = useCallback(
    (text: string) => {
      void bookmarks.search(text)
    },
    [bookmarks]
  )

  return {
    searchText: bookmarks.searchState?.text ?? "",
    handleSearch
  }
}
