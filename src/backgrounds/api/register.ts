import {
	apiMessageChannel,
	ChannelAttachAPI,
	ChannelCallAPI,
	ChannelEventAPI,
} from '~/message-channel';

export function register(handlerObject: object) {
	Object.entries(handlerObject).forEach(([event, handler]) => {
		if (typeof handler !== 'function') {
			return;
		} else if (event in ChannelCallAPI) {
			apiMessageChannel.handleCall(event as ChannelCallAPI, handler.bind(handlerObject));
		} else if (event in ChannelAttachAPI) {
			apiMessageChannel.handleAttach(event as ChannelAttachAPI, handler.bind(handlerObject));
		} else if (event in ChannelEventAPI) {
			apiMessageChannel.on(event as ChannelEventAPI, handler.bind(handlerObject));
		}
	});
}
