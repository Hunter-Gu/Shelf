import { Reorder, useMotionValue, type MotionStyle } from 'framer-motion';
import type { PropsWithChildren } from 'react';

import type { Workspace } from '~/workspace-model';

export function SpaceItem({
	workspace,
	children,
	className,
	style,
}: PropsWithChildren<{ workspace: Workspace; className?: string; style?: MotionStyle }>) {
	const x = useMotionValue(0);

	return (
		<Reorder.Item className={className} value={workspace} id={workspace.id} style={{ x, ...style }}>
			{children}
		</Reorder.Item>
	);
}
