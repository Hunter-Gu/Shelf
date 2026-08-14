import { type ChangeEvent } from 'react';

import { tag, TagEvent } from '~/tag';

import { useBookmarkModel } from '../context/manager-context';
import { useCompute } from '../state';

export function useSearch() {
	const { state, searchState, search } = useBookmarkModel();

	useCompute(state, () => {
		const searchValue = searchState.get();
		if (!searchValue) {
			return;
		}
		search(searchValue.text);
	});

	const handleSearch = async (e: ChangeEvent<HTMLInputElement>) => {
		const text = e.target.value;

		tag.event(TagEvent.Search);

		if (!text) {
			searchState.refresh(null);
			return;
		}

		searchState.refresh((state) =>
			state
				? {
						...state,
						text,
					}
				: {
						tree: null,
						text,
					},
		);

		search(text);
	};

	return { searchText: useCompute(searchState, (state) => state?.text || ''), handleSearch };
}
