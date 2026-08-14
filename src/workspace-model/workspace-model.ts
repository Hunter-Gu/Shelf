import {
	BookmarkModel,
	isFolder,
	toBaseFolder,
	toWorkspaceParentId,
	type Folder,
	type RootTree,
} from '../bookmark-model';
import { Model, read, State, watch } from '../state';
import { proofWorkspaces } from './proof-workspaces';
import { Workspace, WorkspaceType, type IWorkspace } from './workspace';
import { workspaceName } from './workspace-name';
import { WorkspaceService } from './workspace-service';

export class WorkspaceModel extends Model {
	private workspaceService = new WorkspaceService();

	readonly workspaces = new State<Workspace[]>([]);
	readonly currentWorkspace = new State<Workspace>(new Workspace());

	private workspaceParentId = '';

	constructor(private readonly _bookmarkModel: BookmarkModel) {
		super();
		this.disposers.push(
			watch(this._bookmarkModel.state, (tree) => {
				const workspaces = read(this.workspaces);
				if (!workspaces.length || !tree) {
					return;
				}

				this._refreshWorkspaceByTree(workspaces, tree);
			}),
		);
	}

	init = async (tree: RootTree) => {
		this.workspaceParentId = toWorkspaceParentId(tree);

		let workspaces = proofWorkspaces(tree, await this.workspaceService.getAll());
		if (!workspaces.length) {
			const { bookmarksBar, otherBookmarks } = toBaseFolder(tree);
			const [workspacesInBookmarksBar, workspacesInOtherBookmarks] = await Promise.all([
				this._initWorkspaces(WorkspaceType.BookmarksBar, workspaceName.home, bookmarksBar),
				this._initWorkspaces(WorkspaceType.OtherBookmarks, workspaceName.other, otherBookmarks),
			]);
			workspaces = workspacesInBookmarksBar.concat(workspacesInOtherBookmarks);
		}

		this._refreshWorkspaceByTree(workspaces, tree, 0);
	};

	private async _initWorkspaces(type: WorkspaceType, title: string, folder: Folder) {
		const workspace = await this._create({
			id: folder.id,
			title,
			logo: '',
			type,
		});
		const workspaces = [workspace];

		const workspacesByName =
			folder.children?.filter((item) =>
				isFolder(item) ? workspaceName.isValid(item.title) : false,
			) || [];
		if (workspacesByName.length) {
			const createdByNames = await Promise.all(
				workspacesByName.map((workspaceFolder) => {
					return this._create({
						id: workspaceFolder.id,
						title: workspaceName.parse(workspaceFolder.title),
						theme: '',
						logo: '',
					});
				}),
			);
			workspaces.push(...createdByNames);
		}

		return workspaces;
	}

	private _refreshWorkspaceByTree(workspaces: Workspace[], tree: RootTree, preferIndex?: number) {
		if (!workspaces.length) {
			return;
		}
		workspaces = proofWorkspaces(tree, workspaces);

		this.workspaces.refresh(workspaces);
		const workspaceIds = workspaces.map((workspace) => workspace.id);

		if (read(this.currentWorkspace, (current) => !workspaceIds.includes(current.id))) {
			this.currentWorkspace.refresh(
				typeof preferIndex === 'number' ? workspaces[preferIndex] : workspaces.slice(-1)[0],
			);
		}
	}

	create = async ({ title, ...rest }: Omit<IWorkspace, 'id'>) => {
		// create folder at bookmarks bar
		const folder = await this._bookmarkModel.create({
			title: workspaceName.format(title),
			// always create in other bookmarks, so the bookmarks bar is empty
			parentId: this.workspaceParentId,
		});
		return this._create({
			id: folder.id,
			title,
			...rest,
		});
	};

	turnToSpace = async ({
		id,
		title,
		parentId,
		theme = '',
	}: {
		id: string;
		parentId: string;
		title: string;
		theme?: string;
	}) => {
		title = title.trim() || 'Untitled';
		await this._bookmarkModel.change(id, {
			title: workspaceName.format(title),
		});

		if (parentId !== this.workspaceParentId) {
			await this._bookmarkModel.move(id, {
				parentId: this.workspaceParentId,
			});
		}

		await this._create({
			id,
			title,
			theme,
			logo: '',
		});
	};

	private async _create(workspace: IWorkspace) {
		const newWorkspace = Workspace.from(workspace);

		this.workspaces.produce((draft) => {
			draft.push(newWorkspace);
		});
		this.currentWorkspace.refresh(newWorkspace);

		await this._updateStorage();
		return newWorkspace;
	}

	switch = (id: string) => {
		const toWorkspace = read(this.workspaces, (workspaces) =>
			workspaces.find((item) => item.id === id),
		);
		if (toWorkspace) {
			this.currentWorkspace.refresh(toWorkspace);
		}

		this._bookmarkModel.searchState.refresh(null);
	};

	update = (id: string, fn: (item: Workspace) => void) => {
		const targetIndex = read(this.workspaces, (workspaces) =>
			workspaces.findIndex((workspace) => workspace.id === id),
		);

		if (targetIndex === -1) {
			return;
		}

		this.workspaces.produce((draft) => {
			const workspace = draft[targetIndex];
			fn(workspace);

			const copy = Workspace.from(workspace);
			draft[targetIndex] = copy;
		});

		// is current
		if (read(this.currentWorkspace, (current) => current.id === id)) {
			this.currentWorkspace.refresh(read(this.workspaces, (workspaces) => workspaces[targetIndex]));
		}

		this._updateStorage();
	};

	reorder = (workspaces: Workspace[]) => {
		this.workspaces.refresh(workspaces);
		this._updateStorage();
	};

	remove = async (id: string) => {
		const workspaces = read(this.workspaces);
		const targetIndex = workspaces.findIndex((item) => item.id === id);

		if (targetIndex === -1) {
			return;
		}

		this.workspaces.produce((draft) => {
			draft.splice(targetIndex, 1);
		});

		const target = workspaces[targetIndex];

		// TODO support revert
		if (target.type === WorkspaceType.Normal) {
			await this._bookmarkModel.removeTree(id);
		} else {
			const tree = read(this._bookmarkModel.state);
			if (!tree) {
				return;
			}
			await this._removeBaseFolder({
				target,
				workspaces,
				tree,
			});
		}

		return this._updateStorage();
	};

	private _removeBaseFolder({
		target,
		workspaces,
		tree,
	}: {
		target: Workspace;
		workspaces: Workspace[];
		tree: RootTree;
	}) {
		const baseFolder = this._bookmarkModel.getTreeByWorkspaceId({
			workspaces,
			currentWorkspace: target,
			tree,
		});
		const items = baseFolder?.children || [];
		if (items.length) {
			return Promise.all(
				items.map((item) => {
					if (isFolder(item)) {
						this._bookmarkModel.removeTree(item.id);
					} else {
						this._bookmarkModel.remove(item.id);
					}
				}),
			);
		} else {
			return Promise.resolve([]);
		}
	}

	private _updateStorage() {
		return this.workspaceService.update(read(this.workspaces));
	}
}
