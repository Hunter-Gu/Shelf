import type { PlasmoGetStyle } from 'plasmo';

const styles: string[] = [];

export function collect(styleText: string) {
	// TODO should only work in content script
	styles.push(styleText);
}

export function createStyle(styleText: string): PlasmoGetStyle {
	return function getStyle() {
		const style = document.createElement('style');
		style.textContent = [styleText].concat(styles).join('\n');
		return style;
	};
}
