import { cn } from 'common/lib/utils';
import type { MouseEvent } from 'react';

import { BookmarkButton } from './components/bookmark-button/bookmark-button';
import { clsx } from './components/clsx';
import { Editable, useEditable } from './components/editable';
import { FolderTree } from './components/folder-tree';
import { SpaceMenu } from './components/menu/space-menu';
import { Input } from './components/styled';
import { useBookmarkModel, useWorkspaceModel } from './context/manager-context';
import { useSearch } from './hooks/use-search';
import { useCompute } from './state';
import { tag, TagEvent } from './tag';
import type { Workspace } from './workspace-model';

function useTree() {
	const { state, searchState, getTreeByWorkspaceId } = useBookmarkModel();
	const { currentWorkspace, workspaces } = useWorkspaceModel();

	const tree = useCompute(
		[currentWorkspace, workspaces, state, searchState],
		([currentWorkspace, workspaces, tree, search]) => {
			const _tree = search?.tree || tree;

			if (_tree) {
				return getTreeByWorkspaceId({
					currentWorkspace,
					workspaces,
					tree: _tree,
				});
			}
		},
	);

	return tree;
}

const TitleContainer = clsx.div(
	'flex justify-between items-center mx-3 pb-2 border-b border-solid border-b-black/10',
);
const Title = clsx.span('text-base capitalize font-bold text-black');
const ActionsContainer = clsx.div('flex items-center gap-2');

type SidebarProps = {
	onEdit?: (evt: MouseEvent, workspace: Workspace) => void;
};

export function Sidebar({ onEdit }: SidebarProps) {
	const { currentWorkspace, update } = useWorkspaceModel();
	const currentSpace = useCompute(currentWorkspace);
	const { isEditing, setEditing, handleChange } = useEditable((e) => {
		update(currentSpace.id, (workspace) => {
			workspace.title = (e.target as HTMLInputElement).value;
		});
	});
	const { searchText, handleSearch } = useSearch();
	const tree = useTree();

	return (
		<>
			<div className="mx-3 my-4">
				<Input
					type="text"
					placeholder="Hinted search text"
					onChange={handleSearch}
					value={searchText}
				/>
			</div>

			<TitleContainer>
				<Title>
					<span className={cn(currentSpace.logo && 'mr-3')}>{currentSpace.logo}</span>
					<Editable
						isEditing={isEditing}
						text={currentSpace.title}
						preview={<span>{currentSpace.title}</span>}
						onChange={handleChange}
					></Editable>
				</Title>
				<ActionsContainer>
					<BookmarkButton id={currentSpace.id} />
					{tree ? (
						<SpaceMenu
							item={tree}
							onRename={(e) => {
								e.stopPropagation();
								setEditing(true);
								tag.event(TagEvent.Rename, {
									isFolder: true,
								});
							}}
							onEdit={onEdit}
						/>
					) : null}
				</ActionsContainer>
			</TitleContainer>

			{<FolderTree tree={tree} />}
		</>
	);
}
