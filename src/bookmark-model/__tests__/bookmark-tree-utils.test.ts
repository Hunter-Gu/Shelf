import { describe, expect, it } from 'vitest';

import type { Bookmark, Folder } from '~/bookmark-model/types';

import { BookmarkTreeUtils } from '../bookmark-tree-utils';

describe('BookmarkTreeUtils', () => {
	it('#add', () => {
		const root: Folder = {
			id: '0',
			parentId: '0',
			index: 0,
			title: 'root',
			children: [
				{
					id: '1',
					parentId: '0',
					index: 0,
					title: 'node',
					url: '',
				},
			],
		};
		const node: Bookmark = {
			id: '2',
			parentId: '0',
			index: 0,
			title: 'bookmark',
			url: '',
		};
		BookmarkTreeUtils.add(root, node);

		expect(root).toMatchInlineSnapshot(`
			{
			  "children": [
			    {
			      "id": "2",
			      "index": 0,
			      "parentId": "0",
			      "title": "bookmark",
			      "url": "",
			    },
			    {
			      "id": "1",
			      "index": 1,
			      "parentId": "0",
			      "title": "node",
			      "url": "",
			    },
			  ],
			  "id": "0",
			  "index": 0,
			  "parentId": "0",
			  "title": "root",
			}
		`);
	});

	it('#change for folder and bookmark', () => {
		const root: Folder = {
			id: '0',
			parentId: '-1',
			index: 0,
			title: 'root',
			children: [
				{
					id: '1',
					parentId: '0',
					index: 0,
					title: 'node',
					url: '',
				},
			],
		};

		BookmarkTreeUtils.change(root, {
			id: '0',
			title: 'root folder',
		});

		BookmarkTreeUtils.change(root, {
			id: '1',
			title: 'node',
			url: 'http://',
		});

		expect(root).toMatchInlineSnapshot(`
			{
			  "children": [
			    {
			      "id": "1",
			      "index": 0,
			      "parentId": "0",
			      "title": "node",
			      "url": "http://",
			    },
			  ],
			  "id": "0",
			  "index": 0,
			  "parentId": "-1",
			  "title": "root folder",
			}
		`);
	});

	it('#move', () => {
		const root: Folder = {
			id: '0',
			parentId: '-1',
			index: 0,
			title: 'root',
			children: [
				{
					id: '1',
					parentId: '0',
					index: 0,
					title: 'node',
					children: [
						{
							id: '2',
							parentId: '1',
							index: 0,
							title: 'bookmark 1',
							url: '',
						},
						{
							id: '3',
							parentId: '1',
							index: 0,
							title: 'bookmark 2',
							url: '',
						},
					],
				},
			],
		};

		BookmarkTreeUtils.move(root, {
			id: '2',
			index: 0,
			parentId: '0',
			oldIndex: 0,
			oldParentId: '1',
		});

		expect(root).toMatchInlineSnapshot(`
			{
			  "children": [
			    {
			      "id": "2",
			      "index": 0,
			      "parentId": "0",
			      "title": "bookmark 1",
			      "url": "",
			    },
			    {
			      "children": [
			        {
			          "id": "3",
			          "index": 0,
			          "parentId": "1",
			          "title": "bookmark 2",
			          "url": "",
			        },
			      ],
			      "id": "1",
			      "index": 1,
			      "parentId": "0",
			      "title": "node",
			    },
			  ],
			  "id": "0",
			  "index": 0,
			  "parentId": "-1",
			  "title": "root",
			}
		`);
	});

	it('#remove', () => {
		const root: Folder = {
			id: '0',
			parentId: '-1',
			index: 0,
			title: 'root',
			children: [
				{
					id: '1',
					parentId: '0',
					index: 0,
					title: 'node',
					url: '',
				},
				{
					id: '2',
					parentId: '0',
					index: 1,
					title: 'bookmark',
					url: '',
				},
			],
		};

		BookmarkTreeUtils.remove(root, {
			index: 0,
			parentId: '0',
		});

		expect(root).toMatchInlineSnapshot(`
			{
			  "children": [
			    {
			      "id": "2",
			      "index": 0,
			      "parentId": "0",
			      "title": "bookmark",
			      "url": "",
			    },
			  ],
			  "id": "0",
			  "index": 0,
			  "parentId": "-1",
			  "title": "root",
			}
		`);
	});

	it('#reorder', () => {
		const root: Folder = {
			id: '0',
			parentId: '-1',
			index: 0,
			title: 'root',
			children: [
				{
					id: '1',
					parentId: '0',
					index: 0,
					title: 'node',
					url: '',
				},
				{
					id: '2',
					parentId: '0',
					index: 1,
					title: 'bookmark 1',
					url: '',
				},
				{
					id: '3',
					parentId: '0',
					index: 2,
					title: 'bookmark 2',
					url: '',
				},
			],
		};

		BookmarkTreeUtils.reorder(root, {
			id: '0',
			childIds: ['3', '1', '2'],
		});

		expect(root).toMatchInlineSnapshot(`
			{
			  "children": [
			    {
			      "id": "3",
			      "index": 0,
			      "parentId": "0",
			      "title": "bookmark 2",
			      "url": "",
			    },
			    {
			      "id": "1",
			      "index": 1,
			      "parentId": "0",
			      "title": "node",
			      "url": "",
			    },
			    {
			      "id": "2",
			      "index": 2,
			      "parentId": "0",
			      "title": "bookmark 1",
			      "url": "",
			    },
			  ],
			  "id": "0",
			  "index": 0,
			  "parentId": "-1",
			  "title": "root",
			}
		`);
	});
});
