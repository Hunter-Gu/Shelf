/**
 * this is the way to get the favicon by extension
 * - will not send http request
 * - google has a service to get favicon by a url https://www.google.com/s2/favicons
 */
export function faviconURL(pageUrl: string) {
	const url = new URL(chrome.runtime.getURL('/_favicon/'));
	url.searchParams.set('pageUrl', pageUrl);
	url.searchParams.set('size', '32');
	return url.toString();
}
