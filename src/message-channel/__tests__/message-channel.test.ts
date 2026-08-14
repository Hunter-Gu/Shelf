import { expect, it, vitest } from 'vitest';

import { MessageChannel } from '../message-channel';
import { Message, setup } from './setup';

it('on & emit', () => {
	const channel = new MessageChannel();
	const name = 'name';
	const handler = vitest.fn();
	const data = 'hello world';

	channel.on(name, handler);

	channel.emit({ name, body: data });

	expect(handler).toHaveBeenCalledWith(data);
});

it('attach & handleAttach', () => {
	setup();
	const channel = new MessageChannel();
	const name = 'name';
	const data = 'hello world';
	const emitter = new Message();

	const offListener = vitest.fn();
	const listener = vitest.fn();
	channel.handleAttach(name, (param, sendResponse) => {
		listener(param);

		emitter.on(sendResponse);
		return () => {
			offListener();
			emitter.off(sendResponse);
		};
	});

	const trigger = vitest.fn();
	const detach = channel.attach({ name, body: data }, trigger);

	expect(listener).toHaveBeenCalledWith(data);

	const resp1 = 'good day';
	emitter.emit('', resp1);
	expect(trigger).toHaveBeenCalledWith(resp1);

	const resp2 = 'welcome';
	emitter.emit('', resp2);
	expect(trigger).toHaveBeenCalledWith(resp2);

	detach();
	const resp3 = 'thank you';
	emitter.emit('', resp3);
	expect(trigger).not.toHaveBeenCalledWith(resp3);
	expect(offListener).toHaveBeenCalled();
});

it('call & handleCall', async () => {
	const channel = new MessageChannel();
	const name = 'name';
	const data = 'hello world';
	const resp = 'good day';
	const handler = vitest.fn();
	channel.handleCall(name, (param) => {
		handler(param);
		return resp;
	});
	expect(await channel.call({ name, body: data })).toBe(resp);
	expect(handler).toHaveBeenCalledWith(data);
});
