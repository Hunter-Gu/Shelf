import { Divider } from "@astryxdesign/core/Divider"
import { IconButton } from "@astryxdesign/core/IconButton"
import { ToggleButton } from "@astryxdesign/core/ToggleButton"
import { Toolbar } from "@astryxdesign/core/Toolbar"
import { Check, Trash2 } from "lucide-react"
import {
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type Ref
} from "react"

import {
  COLOR_LABELS,
  COLOR_VALUES,
  HIGHLIGHT_COLORS,
  type HighlightColor
} from "./colors"
import { DestinationPicker, type ChosenDestination } from "./destination-picker"
import {
  DEFAULT_SELECTION_PREFERENCES,
  type SelectionPreferences
} from "./preferences"
import { useToolbarAction } from "./toolbar-controls"
import type { ToolbarRect } from "./toolbar-view"

export type ToolbarHandle = {
  setPreferences(value: SelectionPreferences): void
  show(
    rect: ToolbarRect,
    color?: HighlightColor,
    resetDestination?: boolean
  ): void
  hide(): void
  setBusy(value: boolean): void
  showError(message: string): void
  showStatus(message: string): void
  isChoosingDestination(): boolean
  destinationId(): string | undefined
  destinationPath(): string
}
type Props = {
  ref: Ref<ToolbarHandle>
  onColor: (color: HighlightColor) => void
  onRemove: () => void
  onDestination: () => void
}
export function ToolbarPanel({ ref, onColor, onRemove, onDestination }: Props) {
  const [preferences, setPreferences] = useState(DEFAULT_SELECTION_PREFERENCES)
  const [view, setView] = useState({
    visible: false,
    busy: false,
    color: undefined as HighlightColor | undefined,
    anchor: null as ToolbarRect | null,
    revision: 0,
    error: "",
    status: ""
  })
  const panel = useRef<HTMLDivElement>(null)
  const chosenRef = useRef<ChosenDestination | undefined>(undefined)
  const choosing = useRef(false)
  const [chosen, setChosen] = useState<ChosenDestination>()
  const ready = useCallback((value?: ChosenDestination) => {
    chosenRef.current = value
    setChosen(value)
  }, [])
  const openChanged = useCallback((value: boolean) => {
    choosing.current = value
  }, [])
  const removeAction = useToolbarAction(onRemove)
  useImperativeHandle(
    ref,
    () => ({
      setPreferences,
      show(anchor, color, resetDestination = false) {
        if (resetDestination) {
          ready()
          choosing.current = false
        }
        setView((value) => ({
          ...value,
          visible: true,
          anchor,
          color,
          error: "",
          status: "",
          revision: value.revision + Number(resetDestination)
        }))
      },
      hide() {
        choosing.current = false
        setView((value) => ({ ...value, visible: false }))
      },
      setBusy(busy) {
        setView((value) => ({ ...value, busy, error: busy ? "" : value.error }))
      },
      showError(error) {
        setView((value) => ({ ...value, visible: true, error, status: "" }))
      },
      showStatus(status) {
        setView((value) => ({ ...value, visible: true, status, error: "" }))
      },
      isChoosingDestination: () => choosing.current,
      destinationId: () => chosenRef.current?.id,
      destinationPath: () => chosenRef.current?.path ?? "Choose folder"
    }),
    [ready]
  )
  useLayoutEffect(() => {
    const element = panel.current
    const anchor = view.anchor
    if (!element || !anchor || !view.visible) return
    const position = () => {
      const box = element.getBoundingClientRect()
      const center = (anchor.left + anchor.right) / 2
      const left = Math.max(
        8,
        Math.min(center - box.width / 2, window.innerWidth - box.width - 8)
      )
      const fitsAbove = anchor.top >= box.height + 14
      const fitsBelow = anchor.bottom + box.height + 14 <= window.innerHeight
      const above =
        preferences.popupPosition === "above"
          ? fitsAbove || !fitsBelow
          : !fitsBelow && fitsAbove
      const top = above ? anchor.top - box.height - 8 : anchor.bottom + 8
      element.style.left = `${left}px`
      element.style.top = `${Math.max(8, Math.min(top, window.innerHeight - box.height - 8))}px`
      element.classList.toggle("below", !above)
      element.style.setProperty(
        "--arrow-left",
        `${Math.max(12, Math.min(center - left - 4, box.width - 20))}px`
      )
    }
    position()
    const observer = new ResizeObserver(position)
    observer.observe(element)
    return () => observer.disconnect()
  }, [view.anchor, view.visible, preferences.popupPosition])
  const ordered = [
    preferences.defaultColor,
    ...HIGHLIGHT_COLORS.filter((color) => color !== preferences.defaultColor)
  ]
  return (
    <div
      ref={panel}
      className="panel"
      hidden={!view.visible}
      aria-busy={view.busy}>
      <div hidden={!!view.status}>
        <Toolbar
          label="Highlight text"
          size="sm"
          className="highlight-actions"
          startContent={
            <>
              {view.anchor && (
                <DestinationPicker
                  key={view.revision}
                  visible={view.visible && !view.status}
                  busy={view.busy}
                  onReady={ready}
                  onOpenChange={openChanged}
                  onChoose={onDestination}
                />
              )}
              {ordered.map((color) => (
                <ColorAction
                  key={color}
                  color={color}
                  current={view.color}
                  disabled={view.busy || !chosen}
                  onColor={onColor}
                />
              ))}
              {view.color && (
                <>
                  <Divider
                    orientation="vertical"
                    style={{ height: 20, alignSelf: "center" }}
                  />
                  <IconButton
                    label="Remove highlight"
                    icon={<Trash2 size={14} />}
                    variant="ghost"
                    size="sm"
                    isDisabled={view.busy}
                    {...removeAction}
                  />
                </>
              )}
            </>
          }
        />
        {view.error && (
          <p className="error" role="alert">
            {view.error}
          </p>
        )}
      </div>
      {view.status && (
        <div className="status" role="status">
          <Check size={13} />
          <span title={view.status}>{view.status}</span>
        </div>
      )}
    </div>
  )
}
function ColorAction({
  color,
  current,
  disabled,
  onColor
}: {
  color: HighlightColor
  current?: HighlightColor
  disabled: boolean
  onColor: (color: HighlightColor) => void
}) {
  const action = useToolbarAction(() => onColor(color))
  return (
    <ToggleButton
      label={`${current ? "Change highlight to" : "Highlight in"} ${COLOR_LABELS[color].toLowerCase()}`}
      isIconOnly
      size="sm"
      isPressed={color === current}
      isDisabled={disabled}
      icon={
        <span className="swatch" style={{ background: COLOR_VALUES[color] }}>
          {color === current && <Check size={12} />}
        </span>
      }
      {...action}
    />
  )
}
