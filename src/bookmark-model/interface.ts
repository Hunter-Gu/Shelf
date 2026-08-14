import type { Folder } from './types';

export interface IBookmarkModel {
	get bookmarks(): Promise<Folder>;
}
