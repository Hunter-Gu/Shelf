export type EventMap = Record<PropertyKey, unknown>;
export type Protocol = Record<
	PropertyKey,
	{
		Req: unknown;
		Res: unknown;
	}
>;

export type Payload = {
	name: PropertyKey;
	data?: unknown;
	callFlag?: number | string;
	attachFlag?: number | string;
	error?: string;
};

export type Responser = (response?: Payload) => void;

export type MessageData<Name extends PropertyKey, Body extends SafeAny = unknown> = Body extends
	| null
	| undefined
	| void
	? {
			name: Name;
		}
	: {
			name: Name;
			body: Body;
		};

export type FlatPromise<T> = Promise<Awaited<Promise<PromiseLike<T>>>>;
