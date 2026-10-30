import {
  createContext,
  useContext,
  useState,
  type PropsWithChildren
} from "react"

type FolderState = Record<string, boolean>
const FolderStatesContext = createContext<FolderState>({})
const UpdateFolderStateContext = createContext<
  (id: string, value?: boolean) => void
>(() => {})

export function FolderStatesProvider({ children }: PropsWithChildren) {
  const [states, setStates] = useState<FolderState>({})
  const update = (id: string, value?: boolean) => {
    setStates((current) => ({ ...current, [id]: value ?? !current[id] }))
  }
  return (
    <FolderStatesContext.Provider value={states}>
      <UpdateFolderStateContext.Provider value={update}>
        {children}
      </UpdateFolderStateContext.Provider>
    </FolderStatesContext.Provider>
  )
}

export function useFolderState(): FolderState
export function useFolderState(id: string): boolean
export function useFolderState(id?: string): boolean | FolderState {
  const states = useContext(FolderStatesContext)
  return id ? Boolean(states[id]) : states
}

export function useUpdateFolderState() {
  return useContext(UpdateFolderStateContext)
}
