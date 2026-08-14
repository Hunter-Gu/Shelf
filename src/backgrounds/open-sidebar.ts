export function openSidebar() {
	// click action icon will open sidepanel
	chrome.sidePanel.setPanelBehavior({
		openPanelOnActionClick: true,
	});
}
