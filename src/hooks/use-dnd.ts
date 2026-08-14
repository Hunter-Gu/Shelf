import { noop } from 'common/utils/noop';
import { useRef } from 'react';
import {
	useDrag as _useDrag,
	useDrop as _useDrop,
	type DragSourceMonitor,
	type DropTargetMonitor,
} from 'react-dnd';

type Identifier = string | symbol;
type Handler = (...args: any[]) => void;

export function useDrop<Data>(
	accept: Identifier | Identifier[],
	handleHover: (target: Data, monitor: DropTargetMonitor) => void,
) {
	const handlerRef = useRef<Handler>(noop);

	if (handlerRef.current) {
		handlerRef.current = handleHover;
	}

	const [{ isOver }, drop] = _useDrop(
		{
			accept,
			collect(monitor: DropTargetMonitor) {
				return {
					isOver: monitor.isOver(),
				};
			},
			hover(target, monitor) {
				handlerRef.current(target, monitor);
			},
		},
		[accept, handleHover],
	);

	return {
		isOver,
		drop,
	};
}

export function useDrag<Data>(
	type: Identifier,
	data: Data,
	dragEnd: (data: Data, monitor: DragSourceMonitor) => void,
) {
	const [{ isDragging }, drag] = _useDrag(
		{
			type,
			item: () => data,
			collect: (monitor: DragSourceMonitor) => ({
				isDragging: monitor.isDragging(),
				didDrop: monitor.didDrop(),
			}),
			end(item, monitor) {
				if (!monitor.didDrop()) {
					return;
				}

				dragEnd(item, monitor);
			},
		},
		[type, data, dragEnd],
	);

	return {
		isDragging,
		drag,
	};
}
