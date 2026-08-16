import { describe, expect, it } from "vitest"

import { favoriteGridColumnCount } from "./favorite-grid"

describe("favoriteGridColumnCount", () => {
  it.each([
    [0, 0],
    [1, 1],
    [2, 2],
    [3, 3],
    [4, 4],
    [5, 3],
    [6, 3],
    [7, 4],
    [8, 4],
    [9, 3],
    [10, 4],
    [11, 4],
    [12, 4]
  ])("balances %i favorites into %i columns", (itemCount, columns) => {
    expect(favoriteGridColumnCount(itemCount)).toBe(columns)
  })
})
