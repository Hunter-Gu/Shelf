import { enableDirectCall } from '~/env';

import {
	type Attach,
	type AttachAPI,
	type Call,
	type CallAPI,
	type Event,
	type EventAPI,
} from './constants';
import { MessageChannel } from './message-channel';
import { ProxyChannel } from './proxy-channel';

const proxyChannel = new ProxyChannel<CallAPI, AttachAPI, EventAPI>();

// for background
export const messageChannel = new MessageChannel<Call, Attach, Event>();
// for apis in background
export const apiMessageChannel = enableDirectCall
	? proxyChannel
	: new MessageChannel<CallAPI, AttachAPI, EventAPI>();

// only for content scripts
export const contentChannel = new MessageChannel<Call, Attach, Event>();
// only for apis
export const apiContentChannel = enableDirectCall
	? proxyChannel
	: new MessageChannel<CallAPI, AttachAPI, EventAPI>();

export * from './constants';
