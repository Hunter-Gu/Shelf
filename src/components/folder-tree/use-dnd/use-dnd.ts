import type { RefObject } from 'react';

import { useDrag, useDrop } from '~/hooks/use-dnd';

import { type Bookmark, type Folder } from '../../../bookmark-model';
import { useDnD, useUpdateDnD } from '../../../context/dnd-context';
import { useBookmarkModel, useWorkspaceModel } from '../../../context/manager-context';
import { calcMode } from './calc-position';
import { moveItem } from './move-item';

const NAME = 'folder_and_bookmark_item';

export function useItemDrop(ref: RefObject<HTMLElement>, data: Folder | Bookmark) {
	const update = useUpdateDnD();

	return useDrop(NAME, (_, monitor) => {
		if (ref.current) {
			const res = calcMode(ref.current, data, monitor);
			update(res);
		}
	});
}

export function useItemDrag(data: Bookmark | Folder) {
	const { move } = useBookmarkModel();
	const state = useDnD();

	return useDrag(NAME, data, (data) => {
		moveItem(data.id, state, { move });
	});
}
