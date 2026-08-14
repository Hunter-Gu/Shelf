/**
 * !! enum's key should equal to value !!
 */
export enum ChannelEvent {
	Theme = 'Theme',
}

export type Event = {
	[ChannelEvent.Theme]: boolean;
};

export enum ChannelEventAPI {}

export type EventAPI = {};
