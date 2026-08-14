import type { EventMap, FlatPromise, MessageData, Protocol } from './types';

export interface IChannel<Call extends Protocol, Attach extends Protocol, Event extends EventMap> {
	on<EventName extends keyof Event>(
		name: EventName,
		handler: (data: Event[EventName]) => void,
	): Func;

	emit<EventName extends keyof Event>(data: MessageData<EventName, Event[EventName]>): void;

	call<EventName extends keyof Call>(
		data: MessageData<EventName, Call[EventName]['Req']> & {
			timeout?: number;
		},
	): FlatPromise<Call[EventName]['Res']>;

	handleCall<EventName extends keyof Call>(
		name: EventName,
		handler: (
			rags: Call[EventName]['Req'],
		) => Protocol[EventName]['Res'] | Promise<Protocol[EventName]['Res']>,
	): void;

	attach<EventName extends keyof Attach>(
		data: MessageData<EventName, Attach[EventName]['Req']>,
		handler: (data: Attach[EventName]['Res']) => void,
	): Func;

	handleAttach<EventName extends keyof Attach>(
		name: EventName,
		handler: (
			param: Attach[EventName]['Req'],
			sendResponse: (data: Attach[EventName]['Res']) => void,
		) => Func,
	): void;

	dispose(): void;
}
