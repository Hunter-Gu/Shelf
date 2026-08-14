import { MenubarItem, MenubarSeparator, MenubarSub, MenubarSubTrigger } from 'common/ui/menubar';
import { type MouseEventHandler } from 'react';


import { type Bookmark } from '../../bookmark-model';
import { useAppContext } from '~/app/app-context';
import { tabManager } from '~/tabs/actions';
import { Menu } from './menu';
import { MenubarCheckboxItem, MenubarSubContent } from './styled';

type BookmarkMenuProps = {
	onRename?: MouseEventHandler;
	item: Bookmark;
};

export function BookmarkMenu({ item, onRename }: BookmarkMenuProps) {
	const { id } = item;

	const { bookmarks, workspace } = useAppContext();
	const { remove, move } = bookmarks;
	const { workspaces, currentWorkspace: current } = workspace;

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
				}}
			>
				Delete
			</MenubarItem>
		</Menu>
	);
}
