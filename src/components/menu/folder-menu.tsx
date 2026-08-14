import { useUpdateFolderState } from 'common/context/folder-states-context';
import { MenubarItem, MenubarSeparator, MenubarSub, MenubarSubTrigger } from 'common/ui/menubar';
import { type MouseEventHandler } from 'react';

import { useSetEditableId } from '~/context/editable-context';
import { useVirtualTree } from '~/context/virtual-tree-context';
import { useAppContext } from '~/app/app-context';
import { useNextTick } from '~/hooks/use-next-tick';

import { isFolder, type Bookmark, type Folder } from '../../bookmark-model';
import { tabManager } from '~/tabs/actions';
import { Menu } from './menu';
import { MenubarCheckboxItem, MenubarSubContent, Text } from './styled';

type MenuItemProps = {
	onRename?: MouseEventHandler;
	item: Folder;
};

export function FolderMenu({ item, onRename }: MenuItemProps) {
	const { id, title, parentId } = item;
	const updateFolderState = useUpdateFolderState();
	const { scrollToId } = useVirtualTree();
	const nextTick = useNextTick();
	const { bookmarks, workspace } = useAppContext();
	const { create, move, removeTree } = bookmarks;
	const { currentWorkspace: current, workspaces, turnToSpace } = workspace;
	const setEditableId = useSetEditableId();

	const turnToSpaceTitle = `Turn '${title}' into Space`;

	return (
		<Menu>
			<MenubarItem
				onClick={() => {
					tabManager.create(
						(item.children || [])
							.filter((item) => !isFolder(item))
							.map((item) => (item as Bookmark).url),
					);
				}}
			>
				Open All
			</MenubarItem>
			<MenubarItem
				onClick={() => {
					tabManager.createInGroup(
						title,
						(item.children || [])
							.filter((item) => !isFolder(item))
							.map((item) => (item as Bookmark).url),
					);
				}}
			>
				Open All in New Tab Group
			</MenubarItem>
			<MenubarItem
				onClick={() => {
					tabManager.createInNewWindow(
						(item.children || [])
							.filter((item) => !isFolder(item))
							.map((item) => (item as Bookmark).url),
					);
				}}
			>
				Open All in New Window
			</MenubarItem>
			<MenubarItem
				onClick={() => {
					tabManager.createInNewWindow(
						(item.children || [])
							.filter((item) => !isFolder(item))
							.map((item) => (item as Bookmark).url),
						true,
					);
				}}
			>
				Open All in Incognito Window
			</MenubarItem>

			<MenubarSeparator />

			<MenubarItem onClick={onRename}>Rename</MenubarItem>

			<MenubarItem
				onClick={async () => {
					const folder = await create({
						parentId: id,
						title: 'Untitled',
					});
					updateFolderState(id, true);
					nextTick(() => {
						scrollToId(folder.id);
						setEditableId(folder.id);
					});
				}}
			>
				New Nested Folder
			</MenubarItem>

			<MenubarSeparator />

			<MenubarItem
				onClick={() => {
					turnToSpace({
						id,
						parentId,
						title,
					});
				}}
			>
				<Text title={turnToSpaceTitle}>{turnToSpaceTitle}</Text>
			</MenubarItem>

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
					removeTree(id);
				}}
			>
				Delete
			</MenubarItem>
		</Menu>
	);
}
