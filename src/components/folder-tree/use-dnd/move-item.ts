import { BookmarkModel, isFolder } from '../../../bookmark-model';
import { DnDMode, type DnDContextType } from '../../../context/dnd-context';

export function moveItem(
	dragId: string,
	state: DnDContextType,
	{ move }: { move: BookmarkModel['move'] },
) {
	if (!state.id || state.mode === DnDMode.None) {
		return;
	}

	if (state.mode === DnDMode.Insert && isFolder(state)) {
		// move into sub folder
		move(dragId, {
			parentId: state.id,
		});
		return;
	}

	move(dragId, {
		parentId: state.parentId,
		index: state.mode === DnDMode.Append ? state.index + 1 : state.index,
	});
}
