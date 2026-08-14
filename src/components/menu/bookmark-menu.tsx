import { MenubarItem, MenubarSeparator, MenubarSub, MenubarSubTrigger } from 'common/ui/menubar';
import { type MouseEventHandler } from 'react';

import { tag, TagEvent } from '~/tag';

import { type Bookmark } from '../../bookmark-model';
import { useBookmarkModel, useWorkspaceModel } from '../../context/manager-context';
import { useCompute } from '../../state';
import { tabManager } from '../../tab-manager';
import { Menu } from './menu';
import { MenubarCheckboxItem, MenubarSubContent } from './styled';

type BookmarkMenuProps = {
	onRename?: MouseEventHandler;
	item: Bookmark;
};

export function BookmarkMenu({ item, onRename }: BookmarkMenuProps) {
	const { id } = item;

	const { currentWorkspace, workspaces: workspacesState } = useWorkspaceModel();
	const { remove, move } = useBookmarkModel();

	const workspaces = useCompute(workspacesState);
	const current = useCompute(currentWorkspace);

	return (
		<Menu>
			<MenubarItem
				onClick={() => {
					tabManager.createInNewWindow(item.url);
				}}
			>
				Open in New Window
			</MenubarItem>
			<MenubarItem
				onClick={() => {
					tabManager.createInNewWindow(item.url, true);
				}}
			>
				Open in Incognito Window
			</MenubarItem>

			<MenubarSeparator />

			<MenubarItem onClick={onRename}>Rename</MenubarItem>

			<MenubarItem
				onClick={() => {
					navigator.clipboard.writeText(item.url);
					tag.event(TagEvent.CopyLink);
				}}
			>
				Copy Link
			</MenubarItem>

			<MenubarSeparator />

			<MenubarSub>
				<MenubarSubTrigger>Move to</MenubarSubTrigger>
				<MenubarSubContent>
					{workspaces.map((space) => (
						<MenubarCheckboxItem
							key={space.id}
							checked={current.id === space.id}
							onClick={() => {
								if (current.id === space.id) {
									return;
								}
								move(id, {
									parentId: space.id,
								});
								tag.event(TagEvent.MoveToSpace);
							}}
						>
							{space.title}
						</MenubarCheckboxItem>
					))}
				</MenubarSubContent>
			</MenubarSub>

			<MenubarSeparator />

			<MenubarItem
				onClick={() => {
					remove(id);
					tag.event(TagEvent.Delete);
				}}
			>
				Delete
			</MenubarItem>
		</Menu>
	);
}
