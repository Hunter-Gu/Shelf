import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { cn } from 'common/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from 'common/ui/popover';
import { useState } from 'react';

import { tag, TagEvent } from '~/tag';
import type { Workspace } from '~/workspace-model';

import { useWorkspaceModel } from '../../context/manager-context';
import { Input } from '../styled';
import * as styles from './create-workspace.module.css';
import {
	ActionButtonsContainer,
	CancelButton,
	ConfirmButton,
	EmojiContainer,
	EmojiPlaceholder,
	EmojiText,
	Form,
	SpaceDesc,
	SpaceTitle,
} from './styled';

interface CreateWorkspaceProps {
	workspace?: Workspace;
	onConfirm: () => void;
	onCancel: () => void;
}

type EmojiButtonProps = {
	className?: string;
	emoji?: string;
	onEmojiSelect?: (emoji: string) => void;
};
function EmojiButton({ className, emoji, onEmojiSelect }: EmojiButtonProps) {
	const [open, setOpen] = useState(false);
	const handleSelect = ({ native }: { native: string }) => {
		onEmojiSelect?.(native);
		setOpen(false);
	};
	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				{/* <Button variant="outline">Open popover</Button> */}
				<button className={className}>
					{emoji ? (
						<EmojiText style={{ fontSize: '1em' }}>{emoji}</EmojiText>
					) : (
						<EmojiPlaceholder />
					)}
				</button>
			</PopoverTrigger>
			<PopoverContent className={cn('w-80 p-0', styles.picker)}>
				<Picker dynamicWidth data={data} onEmojiSelect={handleSelect} />
			</PopoverContent>
		</Popover>
	);
}

export function CreateWorkspace({ workspace, onConfirm, onCancel }: CreateWorkspaceProps) {
	const isUpdating = !!workspace?.id;
	const [name, setName] = useState(workspace?.title || '');
	const [emoji, setEmoji] = useState(workspace?.logo || '');
	const [theme, setTheme] = useState('');

	const { update, create } = useWorkspaceModel();

	const handleSubmit = async () => {
		if (name.trim()) {
			tag.event(TagEvent.CreateSpace);
			if (isUpdating) {
				await update(workspace.id, (item) => {
					item.title = name;
					item.logo = emoji;
					item.theme = theme;
				});
			} else {
				await create({
					title: name,
					logo: emoji,
					theme,
				});
			}
			onConfirm();
		}
	};

	return (
		<>
			<EmojiContainer>
				<EmojiButton className="w-10 h-10 mt-8  text-5xl" emoji={emoji} onEmojiSelect={setEmoji} />
			</EmojiContainer>
			<SpaceTitle>{isUpdating ? 'Update a Space' : 'Create a Space'}</SpaceTitle>
			<SpaceDesc>Separate your tabs for life, work, projects, and more.</SpaceDesc>

			<Form>
				{/* workspace */}
				<Input
					// eslint-disable-next-line jsx-a11y/no-autofocus
					autoFocus
					type="text"
					placeholder="Space name..."
					defaultValue={name}
					onChange={(e) => setName(e.target.value)}
					required
					className="pl-2"
				/>

				{/* <Theme /> */}
			</Form>

			<ActionButtonsContainer>
				<ConfirmButton type="submit" onClick={handleSubmit} disabled={!name}>
					{isUpdating ? 'Update Space' : 'Create Space'}
				</ConfirmButton>
				<CancelButton variant="ghost" onClick={onCancel}>
					Cancel
				</CancelButton>
			</ActionButtonsContainer>
		</>
	);
}
