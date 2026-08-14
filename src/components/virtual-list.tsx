import { useVirtualizer, Virtualizer } from '@tanstack/react-virtual';
import { cn } from 'common/lib/utils';
import {
	forwardRef,
	useImperativeHandle,
	useRef,
	type Key,
	type ReactElement,
	type Ref,
} from 'react';

import type { Bookmark, Folder } from '~/bookmark-model';

import { clsx } from './clsx';

type VirtualListProps<Data> = {
	list: Data[];
	Row(item: Data, index: number): ReactElement;
	getItemKey?: (item: Data, index: number) => Key;
	className?: string;
};

const VirtualListContainer = clsx.div('overflow-y-auto');

function VirtualListComponent<Data>(
	{ list, className, Row, getItemKey }: VirtualListProps<Data>,
	ref: Ref<Virtualizer<Element, Element>>,
) {
	const containerRef = useRef(null);

	const rowVirtualizer = useVirtualizer({
		count: list.length,
		getScrollElement: () => containerRef.current,
		estimateSize: () => 36,
		overscan: 5,
	});

	useImperativeHandle(ref, () => rowVirtualizer, [rowVirtualizer]);

	return (
		<VirtualListContainer ref={containerRef} className={className}>
			<div
				style={{
					height: `${rowVirtualizer.getTotalSize()}px`,
				}}
				className={cn('relative')}
			>
				{rowVirtualizer.getVirtualItems().map((virtualRow) => {
					const item = list[virtualRow.index];

					return (
						<div
							key={getItemKey?.(item, virtualRow.index) || virtualRow.key}
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								width: '100%',
								height: `${virtualRow.size}px`,
								transform: `translateY(${virtualRow.start}px)`,
							}}
						>
							{Row(item, virtualRow.index)}
						</div>
					);
				})}
			</div>
		</VirtualListContainer>
	);
}

export const VirtualList = forwardRef<
	Virtualizer<Element, Element>,
	VirtualListProps<Folder | Bookmark>
>(VirtualListComponent);
