export type Params = Record<string, string | number | boolean>;

export type NullRecord<T> = {
	[K in keyof T as T[K] extends void ? K : never]: T[K];
};

export type NonNullRecord<T> = {
	[K in keyof T as T[K] extends void ? never : K]: T[K];
};

export enum TagEvent {
	// used in measure only
	PageView = 'page_view',

	CreateSpace = 'create_space',
	MoveToSpace = 'move_to_space',
	SwitchSpace = 'switch_space',

	CreateFolder = 'create_folder',

	Rename = 'rename',
	CopyLink = 'copy_link',
	Delete = 'delete',

	Search = 'search',
}

export type Event2Data = {
	[TagEvent.PageView]: void;

	[TagEvent.CreateSpace]: void;
	[TagEvent.MoveToSpace]: void;
	[TagEvent.SwitchSpace]: void;

	[TagEvent.CreateFolder]: void;

	[TagEvent.Rename]: { isFolder: boolean };
	[TagEvent.CopyLink]: void;
	[TagEvent.Delete]: void;

	[TagEvent.Search]: void;
};
