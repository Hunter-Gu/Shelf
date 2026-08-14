import type { AnchorHTMLAttributes, MouseEventHandler } from 'react';

import { isExtensionEnv } from '../env';
import { tabManager } from '../tab-manager';

export type AnchorProps = Pick<
	AnchorHTMLAttributes<Element>,
	'href' | 'children' | 'className' | 'target' | 'title'
>;

export function Anchor({ children, ...props }: AnchorProps) {
	if (isExtensionEnv) {
		return <MockAnchor {...props}>{children}</MockAnchor>;
	}

	return <a {...props}>{children}</a>;
}

function MockAnchor({ children, href, target, ...rest }: AnchorProps) {
	const handleClick: MouseEventHandler = (e) => {
		if (target === '_blank' || e.ctrlKey || e.metaKey) {
			tabManager.create({
				url: href,
				active: true,
			});
		} else {
			tabManager.create({
				url: href,
				active: true,
			});
			// TODO can't navigate
			// tabManager.replace({
			// 	url: href,
			// 	active: true
			// });
		}
	};
	return (
		<button role="link" {...rest} onClick={handleClick}>
			{children}
		</button>
	);
}
