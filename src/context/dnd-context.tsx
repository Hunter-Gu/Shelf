import { noop } from 'common/utils/noop';
import { createContext, useContext, useState, type PropsWithChildren } from 'react';

import type { Bookmark, Folder } from '../bookmark-model';

export enum DnDMode {
	None,
	Insert,
	AppendBefore,
	Append,
}

export type DnDContextType = {
	mode: DnDMode;
} & (Folder | Bookmark);

const DnDContext = createContext<DnDContextType>({
	id: '',
	title: '',
	index: -1,
	parentId: '',
	url: '',
	mode: DnDMode.None,
});

const UpdateDnDContext = createContext<(state: DnDContextType) => void>(noop);

export function DnDContextProvider({ children }: PropsWithChildren) {
	const [state, setState] = useState<DnDContextType>({
		id: '',
		title: '',
		index: -1,
		parentId: '',
		url: '',
		mode: DnDMode.None,
	});

	const update = (newState: DnDContextType) => {
		if (newState.id === state.id && newState.mode === state.mode) {
			return;
		}
		setState(newState);
	};

	return (
		<DnDContext.Provider value={state}>
			<UpdateDnDContext.Provider value={update}>{children}</UpdateDnDContext.Provider>
		</DnDContext.Provider>
	);
}

export function useDnD() {
	return useContext(DnDContext);
}

export function useUpdateDnD() {
	return useContext(UpdateDnDContext);
}
