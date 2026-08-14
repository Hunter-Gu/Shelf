import { cn } from 'common/lib/utils';
import { Reorder } from 'framer-motion';
import { Plus } from 'lucide-react';

import { useWorkspaceModel } from '../../context/manager-context';
import { useCompute } from '../../state';
import { tag, TagEvent } from '../../tag';
import { clsx } from '../clsx';
import * as styles from './footer.module.css';
import { SpaceItem } from './space-item';

const FooterContainer = clsx.div(
	'flex justify-between items-center px-3 py-4 border-t border-solid border-t-black/10',
);
const IconStyle = 'w-7 h-7 flex items-center justify-center hover:bg-black/10 rounded-md';
const IconButton = clsx.button(IconStyle);

export function Footer({
	isEditingWorkspace,
	onCreateNewSpace,
	onSwitchSpace,
}: {
	isEditingWorkspace: boolean;
	onCreateNewSpace: () => void;
	onSwitchSpace: () => void;
}) {
	const {
		switch: switchTo,
		reorder,
		workspaces: workspacesState,
		currentWorkspace,
	} = useWorkspaceModel();
	const workspaces = useCompute(workspacesState);
	const current = useCompute(currentWorkspace);

	return (
		<FooterContainer className={cn(isEditingWorkspace ? 'mt-0' : 'mt-auto', styles.container)}>
			<div></div>

			<Reorder.Group
				className="flex gap-1 items-center"
				axis="x"
				onReorder={(newOrder) => {
					reorder(newOrder);
				}}
				values={workspaces}
			>
				{workspaces.map((space) => (
					<SpaceItem key={space.id} workspace={space}>
						<IconButton
							key={space.id}
							title={space.title}
							onClick={() => {
								switchTo(space.id);
								tag.event(TagEvent.SwitchSpace);
								onSwitchSpace();
							}}
						>
							<span
								className={cn(
									!space.logo && 'w-2 h-2 rounded-full',
									!space.logo && (space.id === current.id ? 'bg-black/30' : 'bg-black/10'),
									space.logo && (space.id === current.id ? 'grayscale-0' : 'grayscale'),
								)}
							>
								{space.logo}
							</span>
						</IconButton>
					</SpaceItem>
				))}
			</Reorder.Group>

			<IconButton onClick={onCreateNewSpace}>
				<Plus size={20} className="text-gray-600" />
			</IconButton>
		</FooterContainer>
	);
}
