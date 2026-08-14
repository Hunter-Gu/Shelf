import './tailwind.css';

import { cn } from 'common/lib/utils';
import styleText from 'data-text:./index.module.css';
import { useState } from 'react';

import { initAPI } from './backgrounds/api';
import { clsx } from './components/clsx';
import { CreateWorkspace } from './components/create-workspace';
import { Footer } from './components/footer/footer';
import { ManagerProvider } from './context/manager-context';
import { enableDirectCall } from './env';
import { useTheme } from './hooks/use-theme';
import * as style from './index.module.css';
import { Sidebar } from './sidebar';
import { usePageView } from './tag';
import { collect } from './utils/get-style';
import { Workspace } from './workspace-model';

collect(styleText);

const Container = clsx.div(cn('flex flex-col w-full h-screen container', style.container));

if (enableDirectCall) {
	initAPI();
}

export default function SidePanel() {
	const theme = useTheme();

	const [editingWorkspace, setEditingWorkspace] = useState<Workspace>();

	usePageView();

	return (
		<ManagerProvider>
			<Container className={cn(theme, 'max-w-full')}>
				{editingWorkspace ? (
					<CreateWorkspace
						workspace={editingWorkspace}
						onConfirm={() => {
							setEditingWorkspace(undefined);
						}}
						onCancel={() => setEditingWorkspace(undefined)}
					/>
				) : (
					<Sidebar onEdit={(_, workspace) => setEditingWorkspace(workspace)} />
				)}

				<Footer
					isEditingWorkspace={!!editingWorkspace}
					onCreateNewSpace={() => {
						setEditingWorkspace(
							Workspace.from({
								id: '',
								title: '',
								logo: '',
							}),
						);
					}}
					onSwitchSpace={() => {
						setEditingWorkspace(undefined);
					}}
				/>
			</Container>
		</ManagerProvider>
	);
}
