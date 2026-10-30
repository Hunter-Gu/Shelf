import { useCallback, useEffect, useRef, useState } from "react"

export function useNextTick() {
  const [id, setId] = useState(0)

  const cbsRef = useRef<Array<() => void>>([])

  useEffect(() => {
    // even works when call nextTick in cb
    const startArr = [...cbsRef.current]
    startArr.forEach((cb) => {
      const index = cbsRef.current.indexOf(cb)

      cbsRef.current.splice(index, 1)
      cb()
    })
  }, [id])

  useEffect(() => {
    return () => {
      cbsRef.current = []
    }
  }, [])

  const nextTick = useCallback((cb: () => void) => {
    cbsRef.current.push(cb)
    setId((id) => id + 1)
  }, [])

  return nextTick
}
