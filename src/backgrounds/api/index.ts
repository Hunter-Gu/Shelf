import { BookmarkAPI } from './bookmark';
import { ChromeBookmarkEvents } from './bookmark-events';
import { register } from './register';
import { TabAPI } from './tab-api';
import { TabEvents } from './tab-events';

export function initAPI() {
	const bookmarkAPI = new BookmarkAPI();
	register(bookmarkAPI);

	const bookmarkEvents = new ChromeBookmarkEvents();
	register(bookmarkEvents);

	const tabAPI = new TabAPI();
	register(tabAPI);

	const tabEvents = new TabEvents();
	register(tabEvents);
}
