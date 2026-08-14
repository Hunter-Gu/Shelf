import {
	forwardRef,
	useCallback,
	useEffect,
	useRef,
	useState,
	type KeyboardEvent,
	type KeyboardEventHandler,
	type ReactNode,
} from 'react';

import { useForkRef } from '~/hooks/use-fork-ref';

import { clsx } from './clsx';

export type EditableProps = {
	text: string;
	isEditing?: boolean;
	className?: string;
	preview?: ReactNode;
	onChange?: KeyboardEventHandler;
};

const Input = clsx.input('bg-transparent outline-none');

export const Editable = forwardRef<HTMLInputElement, EditableProps>(
	({ isEditing, text, preview, className, onChange }, ref) => {
		const inputRef = useRef<HTMLInputElement>(null);
		const forkRef = useForkRef(inputRef, ref);

		useEffect(() => {
			const rafId = setTimeout(() => {
				if (isEditing) {
					inputRef.current?.focus();
					inputRef.current?.select();
				} else {
					inputRef.current?.blur();
				}
			}, 500);
			return () => clearTimeout(rafId);
		}, [isEditing]);

		return isEditing ? (
			<Input defaultValue={text} className={className} ref={forkRef} onKeyDown={onChange} />
		) : (
			preview
		);
	},
);
Editable.displayName = 'Editable';

export function useEditable(onConfirm?: (e: KeyboardEvent<Element>, newTitle: string) => void) {
	const [isEditing, setEditing] = useState(false);
	const handleChange = useCallback<KeyboardEventHandler>(
		(e) => {
			if (e.key === 'Escape') {
				setEditing(false);
			} else if (e.key === 'Enter') {
				setEditing(false);
				onConfirm?.(e, (e.target as HTMLInputElement).value);
			}
		},
		[onConfirm],
	);

	return {
		isEditing,
		setEditing,
		handleChange,
	};
}
