import { MenubarMenu } from 'common/ui/menubar';
import { EllipsisIcon as _EllipsisIcon } from 'lucide-react';
import { type PropsWithChildren } from 'react';

import { useSetFocus } from '~/context/focus-context';

import { withClsx } from '../clsx';
import { Menubar, MenubarContent, MenubarTrigger } from './styled';

type MenuProps = {};

const EllipsisIcon = withClsx(_EllipsisIcon, 'h-4 w-4 text-gray-500');

export function Menu({ children }: PropsWithChildren<MenuProps>) {
	const setFocus = useSetFocus();

	return (
		<Menubar onClick={(e) => e.stopPropagation()} onValueChange={(v) => setFocus(!!v)}>
			<MenubarMenu>
				<MenubarTrigger>
					<span>
						<EllipsisIcon />
					</span>
				</MenubarTrigger>
				<MenubarContent>{children}</MenubarContent>
			</MenubarMenu>
		</Menubar>
	);
}
