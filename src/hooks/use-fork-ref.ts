import {
  useMemo,
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
  ...refs: Array<Ref<Instance> | undefined>
): RefCallback<Instance> | null {
  return useMemo(
    () => (node: Instance) => refs.forEach((ref) => setRef(ref, node)),
    refs
  )
}
