import { clsx } from '../clsx';

export const ItemContainer = clsx.div(
	'relative group block flex items-center p-2 mb-1 box-border rounded-lg transition-all duration-200 hover:bg-black/10',
);
export const ItemActionsContainer = clsx.span(
	'absolute top-1/2 -translate-y-1/2 right-2 flex flex-row gap-2 invisible group-hover:visible',
);
