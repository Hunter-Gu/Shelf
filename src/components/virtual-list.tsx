import { useVirtualizer, Virtualizer } from "@tanstack/react-virtual"
import { cn } from "common/lib/utils"
import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type Key,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefAttributes
} from "react"

import { clsx } from "./clsx"

// Fixed, unmeasured row height — every row in every list this component
// renders is a single line, so a constant is enough and lets drag offsets
// (see getItemOffset) be plain arithmetic instead of a DOM measurement.
export const VIRTUAL_ROW_HEIGHT = 36

type VirtualListProps<Data> = {
  list: Data[]
  Row(item: Data, index: number): ReactElement
  getItemKey?: (item: Data, index: number) => Key
  // Extra pixels to add on top of a row's normal virtualized position —
  // used to slide rows out of the way of a drag-and-drop landing slot
  // without touching `list` itself, so the virtualizer's item count/keys
  // stay stable during a drag and never force a remeasure.
  getItemOffset?: (item: Data, index: number) => number
  // Rendered as an extra absolutely-positioned child alongside the virtual
  // rows, in the same coordinate space (so `top` in its own style lines up
  // with row-index * VIRTUAL_ROW_HEIGHT) — the drop placeholder uses this
  // instead of being spliced into `list`.
  overlay?: ReactNode
  className?: string
}

const VirtualListContainer = clsx.div("overflow-y-auto")

function VirtualListComponent<Data>(
  {
    list,
    className,
    Row,
    getItemKey,
    getItemOffset,
    overlay
  }: VirtualListProps<Data>,
  ref: Ref<Virtualizer<Element, Element>>
) {
  const containerRef = useRef(null)

  const rowVirtualizer = useVirtualizer({
    count: list.length,
    getScrollElement: () => containerRef.current,
    getItemKey: (index) => getItemKey?.(list[index], index) ?? index,
    estimateSize: () => VIRTUAL_ROW_HEIGHT,
    overscan: 5
  })

  useImperativeHandle(ref, () => rowVirtualizer, [rowVirtualizer])

  return (
    <VirtualListContainer ref={containerRef} className={className}>
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`
        }}
        className={cn("relative")}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const item = list[virtualRow.index]
          const offset = getItemOffset?.(item, virtualRow.index) ?? 0

          return (
            <div
              key={getItemKey?.(item, virtualRow.index) || virtualRow.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start + offset}px)`,
                transition: "transform 150ms ease"
              }}>
              {Row(item, virtualRow.index)}
            </div>
          )
        })}
        {overlay}
      </div>
    </VirtualListContainer>
  )
}

export const VirtualList = forwardRef(VirtualListComponent) as <Data>(
  props: VirtualListProps<Data> & RefAttributes<Virtualizer<Element, Element>>
) => ReactElement
