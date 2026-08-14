import { DnDMode } from '../../context/dnd-context';
import * as styles from './folder-tree.module.css';

export const FocusedStyle = 'bg-black/10';

const appendBeforeStyle = styles.appendBefore;
const appendStyle = styles.append;
const insertStyle = 'bg-gray-200';
export const getDnDStyle = (isOver: boolean, mode: DnDMode) =>
	isOver
		? mode === DnDMode.Append
			? appendStyle
			: mode === DnDMode.Insert
				? insertStyle
				: mode === DnDMode.AppendBefore
					? appendBeforeStyle
					: ''
		: '';
