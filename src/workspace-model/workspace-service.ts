import { StorageManager } from '~/storage-manager';

import type { Workspace } from './workspace';

const SPACE_STORAGE_NAME = 'workspaces';

export class WorkspaceService {
	private storage = new StorageManager<Workspace[]>(SPACE_STORAGE_NAME);

	async getAll() {
		return (await this.storage.get()) || [];
	}

	update(workspaces: Workspace[]) {
		return this.storage.update(workspaces);
	}
}
