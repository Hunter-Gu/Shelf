import { noop } from 'common/utils/noop';
import { createContext, useContext, useState, type PropsWithChildren } from 'react';

const IsFocusedContext = createContext<boolean>(false);

const SetFocusContext = createContext<(focus: boolean) => void>(noop);

export function FocusProvider({ children }: PropsWithChildren<unknown>) {
	const [focused, setFocus] = useState(false);
	return (
		<IsFocusedContext.Provider value={focused}>
			<SetFocusContext.Provider value={setFocus}>{children}</SetFocusContext.Provider>
		</IsFocusedContext.Provider>
	);
}

export function useIsFocused() {
	return useContext(IsFocusedContext);
}

export function useSetFocus() {
	return useContext(SetFocusContext);
}
