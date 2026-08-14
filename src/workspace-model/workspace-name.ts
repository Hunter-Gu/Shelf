const WORKSPACE_NAME_SUFFIX = '(Workspace)';

export const workspaceName = {
	home: 'Home',
	other: 'Other',
	// workspace folder include 'workspace' in its name
	isValid(folderTitle: string) {
		return folderTitle.endsWith(WORKSPACE_NAME_SUFFIX);
	},
	parse(folderTitle: string) {
		const regexp = new RegExp(WORKSPACE_NAME_SUFFIX.replace('(', '\\(').replace(')', '\\)') + '$');
		return folderTitle.replace(regexp, '').trim();
	},
	format(title: string) {
		return `${title} ${WORKSPACE_NAME_SUFFIX}`;
	},
};
