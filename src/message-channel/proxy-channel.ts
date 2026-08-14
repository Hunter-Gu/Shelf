import type { IChannel } from './interface';
import { timeoutAction } from './timeout-action';
import type { EventMap, FlatPromise, MessageData, Payload, Protocol } from './types';

export class ProxyChannel<Call extends Protocol, Attach extends Protocol, Event extends EventMap>
	implements IChannel<Call, Attach, Event>
{
	private events: Record<PropertyKey, Func[]> = {};
	private calls: Record<PropertyKey, Func> = {};
	private attaches: Record<
		PropertyKey,
		(params: unknown, sendResponse: (data: unknown) => void) => Func
	> = {};

	on<EventName extends keyof Event>(
		name: EventName,
		handler: (data: Event[EventName]) => void,
	): Func {
		if (!Array.isArray(this.events[name])) {
			this.events[name] = [];
		}
		this.events[name].push(handler);

		return () => {
			const index = this.events[name].indexOf(handler);

			this.events[name]?.splice(index, 1);
		};
	}

	emit<EventName extends keyof Event>(params: MessageData<EventName, Event[EventName]>): void {
		const { name } = params;

		this.events[name].forEach((handler) => {
			handler(this._getData(params));
		});
	}

	call<EventName extends keyof Call>(
		params: MessageData<EventName, Call[EventName]['Req']> & { timeout?: number },
	): FlatPromise<Call[EventName]['Res']> {
		const { name, timeout = 3000 } = params;

		return new Promise<Awaited<Call[EventName]['Res']>>((resolve, reject) => {
			const action = timeoutAction({
				action: ({ error, data }: Payload) => {
					if (error) {
						reject(error);
					} else {
						resolve(data as Awaited<Call[EventName]['Res']>);
					}
				},
				timeout: reject,
				ms: timeout,
			});

			const run = async () => {
				try {
					const result = await this.calls[name](this._getData(params));
					action({
						name,
						data: result as unknown,
					});
				} catch (e) {
					const error = (e as Error).message;
					action({
						name,
						error,
					});
				}
			};

			run();
		});
	}

	handleCall<EventName extends keyof Call>(
		name: EventName,
		handler: (
			rags: Call[EventName]['Req'],
		) => Protocol[EventName]['Res'] | Promise<Protocol[EventName]['Res']>,
	): void {
		this.calls[name] = handler;
	}

	attach<EventName extends keyof Attach>(
		params: MessageData<EventName, Attach[EventName]['Req']>,
		handler: (data: Attach[EventName]['Res']) => void,
	): Func {
		const { name } = params;
		return this.attaches[name](this._getData(params), handler);
	}

	private _getData(params: MessageData<SafeAny, SafeAny>) {
		return 'body' in params ? params.body : undefined;
	}

	handleAttach<EventName extends keyof Attach>(
		name: EventName,
		handler: (
			param: Attach[EventName]['Req'],
			sendResponse: (data: Attach[EventName]['Res']) => void,
		) => Func,
	) {
		this.attaches[name] = handler;
	}

	dispose(): void {
		this.events = {};
		this.calls = {};
		this.attaches = {};
	}
}
