import type { DropTargetMonitor } from 'react-dnd';

import { isFolder, type Bookmark, type Folder } from '../../../bookmark-model';
import { DnDMode, type DnDContextType } from '../../../context/dnd-context';

export function calcMode(
	dropElm: HTMLElement,
	dropItem: Bookmark | Folder,
	monitor: DropTargetMonitor,
): DnDContextType {
	// Determine rectangle on screen
	const hoverBoundingRect = dropElm.getBoundingClientRect();

	// as folder: 0-25%, 26%-74%, 75%-100%
	// as bookmark: 0-50%, 51%-100%
	const metric = isFolder(dropItem) ? 0.25 : 0.5;

	// y less than metric, think hover over previous items
	const prevMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) * metric;
	// y bigger than (1 - metric), think hover over next items
	const nextMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) * (1 - metric);

	// Determine mouse position
	const clientOffset = monitor.getClientOffset()!;
	// Get pixels to the top
	const hoverClientY = clientOffset.y - hoverBoundingRect.top;

	if (hoverClientY <= prevMiddleY) {
		return {
			...dropItem,
			mode: DnDMode.AppendBefore,
		};
	}

	// Dragging upwards
	if (hoverClientY >= nextMiddleY) {
		return {
			...dropItem,
			mode: DnDMode.Append,
		};
	}

	return {
		...dropItem,
		mode: DnDMode.Insert,
	};
}
