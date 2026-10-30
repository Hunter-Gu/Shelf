import {
  useCallback,
  type MutableRefObject,
  type Ref,
  type RefCallback
} from "react"

export default function setRef<T>(
  ref:
    | MutableRefObject<T | null>
    | ((instance: T | null) => void)
    | null
    | undefined,
  value: T | null
): void {
  if (typeof ref === "function") {
    ref(value)
  } else if (ref) {
    ref.current = value
  }
}

export function useForkRef<Instance>(
  first: Ref<Instance> | undefined,
  second: Ref<Instance> | undefined
): RefCallback<Instance> {
  return useCallback(
    (node: Instance) => {
      setRef(first, node)
      setRef(second, node)
    },
    [first, second]
  )
}
