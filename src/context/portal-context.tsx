import {
  createContext,
  forwardRef,
  useContext,
  type ComponentType,
  type PropsWithChildren
} from "react"

type PortalContextValue = null | HTMLElement | undefined

const PortalContext = createContext<PortalContextValue>(null)

export function PortalProvider({
  container,
  children
}: PropsWithChildren<{ container?: PortalContextValue }>) {
  return (
    <PortalContext.Provider value={container}>
      {children}
    </PortalContext.Provider>
  )
}

export function usePortalContainer() {
  return useContext(PortalContext)
}

export function withPortalContainer<
  Props extends { container?: PortalContextValue }
>(Comp: ComponentType<Props>) {
  const Component = forwardRef<
    React.ElementRef<typeof Comp>,
    Omit<Props, "container">
  >((props, ref) => {
    const container = usePortalContainer()
    const options = { ...props, container } as Props

    return <Comp {...options} ref={ref} />
  })

  Component.displayName = `withPortalContainer(${Comp.displayName || Comp.name})`

  return Component
}
