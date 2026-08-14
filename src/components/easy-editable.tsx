import {
	cloneElement,
	useMemo,
	type KeyboardEvent,
	type MouseEvent,
	type ReactElement,
} from 'react';

import { useClickOutside } from '~/context/use-click-outside';

import { Editable, useEditable, type EditableProps } from './editable';

export type EasyEditableProps = Omit<EditableProps, 'preview' | 'isEditing' | 'onChange'> & {
	preview: ReactElement;
	onChange?: (e: KeyboardEvent<Element>, newTitle: string) => void;
};

export function EasyEditable({ preview, onChange, ...props }: EasyEditableProps) {
	const { isEditing, setEditing, handleChange } = useEditable(onChange);

	const ref = useClickOutside<HTMLInputElement>({
		disabled: !isEditing,
		handler() {
			setEditing(false);
			// TODO should be confirm
		},
	});

	const myPreview = useMemo(
		() =>
			cloneElement(preview, {
				onClick(e: MouseEvent<Element, Element>) {
					e.stopPropagation();
					setEditing(true);
				},
			}),
		[preview, setEditing],
	);

	return (
		<Editable
			{...props}
			ref={ref}
			isEditing={isEditing}
			preview={myPreview}
			onChange={handleChange}
		/>
	);
}
