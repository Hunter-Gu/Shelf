import { useEffect, useRef } from "react"

type PromiseCreator<Args extends unknown[], T> = (...args: Args) => Promise<T>

class AutoAbortPromise<Args extends unknown[], T> {
  private _cancelled = false

  constructor(private fn: PromiseCreator<Args, T>) {}

  create(...args: Args) {
    return new Promise<T>((resolve, reject) => {
      this.fn(...args)
        .then((data) => {
          if (this._cancelled) {
            return
          }
          resolve(data)
        })
        .catch(reject)
    })
  }

  abort() {
    this._cancelled = true
    this.fn = () => Promise.resolve(null as T)
  }
}

export function createAutoAbort() {
  let autoAbort: { abort(): void } | undefined

  function switchFn<Args extends unknown[], T>(fn: PromiseCreator<Args, T>) {
    autoAbort?.abort()
    const next = new AutoAbortPromise<Args, T>(fn)
    autoAbort = next

    return next.create(...([] as unknown as Args))
  }

  function dispose() {
    autoAbort?.abort()
    autoAbort = undefined
  }

  return { switchFn, dispose }
}

export function useAutoAbort() {
  const ref = useRef<ReturnType<typeof createAutoAbort> | undefined>(undefined)

  if (!ref.current) {
    ref.current = createAutoAbort()
  }

  useEffect(() => {
    return () => ref.current?.dispose()
  }, [])

  const autoAbort = ref.current

  return autoAbort.switchFn.bind(autoAbort)
}
