import { cn } from 'common/lib/utils';

import { useBookmarkModel } from '~/context/manager-context';
import { useCurrentTabBookmark } from '~/context/tab-bookmark-context';
import { useAutoAbort } from '~/hooks/use-auto-abort';

import { BookmarkCheckIcon, BookmarkPlusIcon, Button, FileInputIcon } from './styled';

type BookmarkButtonProps = {
	// should be the id of a folder
	id: string;
};

/**
 * 1. show add button: add current page to current folder
 * 2. show remove button: remove current page from current folder
 * 3. show move button: move current page from other folder to current folder
 */
export function BookmarkButton({ id }: BookmarkButtonProps) {
	const { create, remove, move } = useBookmarkModel();
	const { currentTab, bookmark } = useCurrentTabBookmark();
	const switchFn = useAutoAbort();

	if (!bookmark) {
		return (
			<Button
				title="Save current page"
				onClick={async (evt) => {
					evt.stopPropagation();
					const { url, title = '' } = currentTab || {};
					if (!url) {
						return;
					}
					switchFn(() =>
						create({
							title,
							url,
							parentId: id,
						}),
					);
				}}
			>
				<BookmarkPlusIcon className={cn('text-gray-500')} />
			</Button>
		);
	}

	if (bookmark.parentId === id) {
		return (
			<Button
				title="Remove current page"
				onClick={(evt) => {
					evt.stopPropagation();

					switchFn(() => remove(bookmark.id));
				}}
			>
				<BookmarkCheckIcon className={cn('text-amber-500')} />
			</Button>
		);
	}

	return (
		<Button
			title="Move current page"
			onClick={(evt) => {
				evt.stopPropagation();

				switchFn(() =>
					move(bookmark.id, {
						parentId: id,
					}),
				);
			}}
		>
			<FileInputIcon className={cn('text-amber-500')} />
		</Button>
	);
}
