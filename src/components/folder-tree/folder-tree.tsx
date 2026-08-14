import { FolderStatesProvider } from 'common/context/folder-states-context';
import { cn } from 'common/lib/utils';
import styleText from 'data-text:./folder-tree.module.css';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import type { Folder } from '~/bookmark-model';
import { collect } from '~/utils/get-style';

import { DnDContextProvider } from '../../context/dnd-context';
import { clsx, withClsx } from '../clsx';
import * as styles from './folder-tree.module.css';
import { VirtualTree as _VirtualTree } from './virtual-tree';

collect(styleText);

type FolderTreeProps = {
	tree?: Folder | null;
};

const TreeContainer = clsx.div(
	cn('h-full max-h-full overflow-y-hidden pt-4 pb-10 px-3', styles.folderTree),
);
const VirtualTree = withClsx(_VirtualTree, cn('h-full overflow-x-hidden', styles.folderTree));

export function FolderTree({ tree }: FolderTreeProps) {
	return (
		<DndProvider backend={HTML5Backend}>
			<DnDContextProvider>
				<FolderStatesProvider>
					{tree ? (
						<TreeContainer>
							<VirtualTree tree={tree} />
						</TreeContainer>
					) : null}
				</FolderStatesProvider>
			</DnDContextProvider>
		</DndProvider>
	);
}
