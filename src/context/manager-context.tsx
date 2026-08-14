import { createContext, useContext, useEffect, useMemo, type PropsWithChildren } from 'react';

import { apiContentChannel } from '~/message-channel';

import { BookmarkEvents, BookmarkModel, type RootTree } from '../bookmark-model';
import { State } from '../state';
import { WorkspaceModel } from '../workspace-model';
import { EditableProvider } from './editable-context';
import { CurrentTabBookmarkProvider } from './tab-bookmark-context';
import { VirtualTreeProvider } from './virtual-tree-context';

const DEFAULT_BOOKMARK_MODEL = new BookmarkModel();
const BookmarkModelContext = createContext<BookmarkModel>(DEFAULT_BOOKMARK_MODEL);

export function useBookmarkModel() {
	return useContext(BookmarkModelContext);
}

const WorkspaceModelContext = createContext<WorkspaceModel>(
	new WorkspaceModel(DEFAULT_BOOKMARK_MODEL),
);

export function useWorkspaceModel() {
	return useContext(WorkspaceModelContext);
}

export function ManagerProvider({ children }: PropsWithChildren) {
	const bookmarkModel = useMemo(() => new BookmarkModel(), []);

	const workspaceModel = useMemo(() => new WorkspaceModel(bookmarkModel), [bookmarkModel]);

	useEffect(() => {
		return () => {
			bookmarkModel.dispose();
			workspaceModel.dispose();
		};
	}, [bookmarkModel, workspaceModel]);

	useInitManagers({
		bookmarkModel: bookmarkModel,
		workspaceModel: workspaceModel,
	});
	useBookmarkEvents(bookmarkModel);
	useInitMessageChannel();

	return (
		<WorkspaceModelContext.Provider value={workspaceModel}>
			<BookmarkModelContext.Provider value={bookmarkModel}>
				<CurrentTabBookmarkProvider bookmarkManager={bookmarkModel}>
					<VirtualTreeProvider>
						<EditableProvider>{children}</EditableProvider>
					</VirtualTreeProvider>
				</CurrentTabBookmarkProvider>
			</BookmarkModelContext.Provider>
		</WorkspaceModelContext.Provider>
	);
}

function useInitManagers({
	workspaceModel,
	bookmarkModel,
}: {
	workspaceModel: WorkspaceModel;
	bookmarkModel: BookmarkModel;
}) {
	useEffect(() => {
		(async function () {
			await bookmarkModel.init();
			const bookmarkTree = bookmarkModel.state.get();
			bookmarkTree && workspaceModel.init(bookmarkTree);
		})();
	}, [workspaceModel, bookmarkModel]);
}

function useBookmarkEvents(bookmarkModel: BookmarkModel) {
	const bookmarkEvents = useMemo(() => new BookmarkEvents(bookmarkModel), [bookmarkModel]);

	useEffect(() => {
		const createDisposer = bookmarkEvents.onCreated();
		const changeDisposer = bookmarkEvents.onChanged();
		const reorderDisposer = bookmarkEvents.onChildrenReordered();
		const moveDisposer = bookmarkEvents.onMoved();
		const removeDisposer = bookmarkEvents.onRemoved();

		return () => {
			createDisposer();
			changeDisposer();
			reorderDisposer();
			moveDisposer();
			removeDisposer();
		};
	}, [bookmarkEvents]);

	return bookmarkEvents;
}

function useInitMessageChannel() {
	useEffect(() => {
		return () => {
			apiContentChannel.dispose();
		};
	}, []);
}
