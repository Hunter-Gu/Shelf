const MAX_FAVORITES_PER_ROW = 4

export function favoriteGridColumnCount(itemCount: number) {
  if (itemCount <= 0) return 0

  const rowCount = Math.ceil(itemCount / MAX_FAVORITES_PER_ROW)
  return Math.ceil(itemCount / rowCount)
}
