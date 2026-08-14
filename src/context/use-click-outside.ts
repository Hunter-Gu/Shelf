import { useEffect, useRef } from 'react';

export function useClickOutside<T extends Element = HTMLDivElement>({
	disabled,
	handler,
}: {
	disabled?: boolean;
	handler: () => void;
}) {
	const containerRef = useRef<T>(null);
	const handlerRef = useRef(() => {});
	handlerRef.current = handler;

	useEffect(() => {
		const handler = (event: Event) => {
			const container = containerRef.current;
			if (!container) {
				return;
			}

			if (!event.composedPath().includes(container)) {
				handlerRef.current();
			}
		};

		if (!disabled) {
			document.documentElement.addEventListener('click', handler);
		}

		return () => document.documentElement.removeEventListener('click', handler);
	}, [disabled]);

	return containerRef;
}
