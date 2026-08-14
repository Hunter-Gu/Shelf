import { noop } from 'common/utils/noop';
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
	type KeyboardEvent,
	type KeyboardEventHandler,
	type PropsWithChildren,
} from 'react';

import { useClickOutside } from './use-click-outside';

type Id = string | number | null | undefined;
export const EditableIdContext = createContext<Id>(null);

export const SetEditableIdContext = createContext<(id: Id) => void>(noop);

export function EditableProvider({ children }: PropsWithChildren<unknown>) {
	const [currentId, setCurrentId] = useState<Id>();

	return (
		<EditableIdContext.Provider value={currentId}>
			<SetEditableIdContext.Provider value={setCurrentId}>{children}</SetEditableIdContext.Provider>
		</EditableIdContext.Provider>
	);
}

export function useSetEditableId() {
	return useContext(SetEditableIdContext);
}

export function useEditableId() {
	return useContext(EditableIdContext);
}

export function useEditable(
	id: string | number,
	onConfirm?: (e: KeyboardEvent<Element>, newTitle: string) => void,
) {
	const editableId = useEditableId();
	const setEditingId = useSetEditableId();

	const isEditing = useMemo(() => id === editableId, [editableId, id]);
	const setEditing = useCallback(
		(editable: boolean) => {
			if (editable) {
				setEditingId(id);
			} else if (isEditing) {
				setEditingId('');
			}
		},
		[id, isEditing, setEditingId],
	);
	const handleChange = useCallback<KeyboardEventHandler>(
		(e) => {
			if (e.key === 'Escape') {
				setEditingId('');
			} else if (e.key === 'Enter') {
				setEditingId('');
				onConfirm?.(e, (e.target as HTMLInputElement).value);
			}
		},
		[setEditingId, onConfirm],
	);

	const ref = useClickOutside({
		disabled: !isEditing,
		handler() {
			setEditing(false);
		},
	});

	return {
		ref,
		isEditing,
		setEditing,
		handleChange,
	};
}
