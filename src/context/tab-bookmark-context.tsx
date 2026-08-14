import { createContext, useContext, useEffect, useMemo, type PropsWithChildren } from 'react';

import type { AttachAPI, ChannelAttachAPI } from '~/message-channel';
import { TabEvents } from '~/tab-manager/tab-events';

import {
	BookmarkModel,
	isFolder,
	type Bookmark,
	type Folder,
	type RootTree,
} from '../bookmark-model';
import { State, useCompute, useReactive } from '../state';

type CurrentTab = AttachAPI[ChannelAttachAPI.OnTabActivatedOrUpdated]['Res'] | null;
type CurrentTabStateValue = {
	currentTab: CurrentTab;
	bookmark: Bookmark | null;
};

const DEFAULT_TAB_BOOKMARK: CurrentTabStateValue = {
	currentTab: null,
	bookmark: null,
};

const CurrentTabBookmarkContext = createContext(DEFAULT_TAB_BOOKMARK);

function findDescendantBookmark(folder: Folder | RootTree, url: string): Bookmark | null {
	const children = folder.children || [];

	let searchResult: Bookmark | null = null;
	for (let i = 0; i < children.length; i++) {
		const child = children[i];
		if (isFolder(child)) {
			searchResult = findDescendantBookmark(child, url);
		} else if (child.url === url) {
			searchResult = child;
		}

		if (searchResult) {
			return searchResult;
		}
	}

	return searchResult;
}

export function CurrentTabBookmarkProvider({
	bookmarkManager,
	children,
}: PropsWithChildren<{
	bookmarkManager: BookmarkModel;
}>) {
	const { state: currentTabState, value: currentTab } = useReactive<CurrentTab>(null);

	const { url } = currentTab || {};
	const tree = useCompute(bookmarkManager.state);
	const bookmark = tree && url ? findDescendantBookmark(tree, url) : null;

	useTabEvents(currentTabState);

	return (
		<CurrentTabBookmarkContext.Provider
			value={{
				bookmark,
				currentTab,
			}}
		>
			{children}
		</CurrentTabBookmarkContext.Provider>
	);
}

export function useCurrentTabBookmark() {
	return useContext(CurrentTabBookmarkContext);
}

function useTabEvents(state: State<CurrentTab>) {
	const tabEvents = useMemo(() => new TabEvents(state), [state]);

	useEffect(() => {
		const disposer = tabEvents.onActivatedAndUpdated();

		return disposer;
	}, [tabEvents]);

	return tabEvents;
}
