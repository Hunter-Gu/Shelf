import { createDraft, finishDraft, produce } from 'immer';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export class State<Type> {
	protected notifies: Array<(root: Type) => void> = [];

	private _locks: Set<string | symbol | number> = new Set();

	constructor(protected _state: Type) {}

	// don't use in react, except useExternalStore
	get() {
		return this._state;
	}

	register(notify: (root: Type) => void) {
		this.notifies.push(notify);
		return () => {
			const index = this.notifies.indexOf(notify);
			this.notifies.splice(index, 1);
		};
	}

	// force notify update
	refresh(state: Type): void;
	refresh(state: (data: Type) => Type): void;
	refresh(state: unknown) {
		this._state = typeof state === 'function' ? state(this._state) : state;
		this.notify();
	}

	// use by classes
	produce(fn: (root: NonNullable<Type>) => void) {
		// TODO should remove it
		if (this._locks.size || this._state === null || this._state === undefined) {
			return;
		}

		const state = produce(this._state, (draft) => {
			fn(draft as NonNullable<Type>);
		});
		this._state = state;
		this.notify();
	}

	async produceAsync(fn: (root: NonNullable<Type>) => Promise<void>) {
		if (this._locks.size || this._state === null || this._state === undefined) {
			return;
		}

		const draft = createDraft(this._state);
		await fn(draft as NonNullable<Type>);
		const state = finishDraft(draft) as Type;

		this._state = state;
		this.notify();
	}

	private notify() {
		this.notifies.forEach((notifier) => notifier(this._state));
	}

	lock(name: string | number | symbol) {
		this._locks.add(name);
	}

	unlock(name: string | number | symbol) {
		this._locks.delete(name);
	}

	dispose() {
		this.notifies = [];
	}
}

type Transform<Type, Return> = (data: Type) => Return;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const id = (data: any) => data;

export function useReactive<Type, Return = Type>(
	initValue: Type,
	transform: Transform<Type, Return> = id,
) {
	const state = useMemo(() => new State<Type>(initValue), []);

	const value = useCompute(state, transform);

	return { state, value };
}

const NO_CACHE = Symbol();

/**
 * watch a state, and compute it
 * - don't watch a state then update it in selector
 * - don't access react state in compute
 *
 * bad case:
 * useSyncValue(state, (data) => {
 * 	!!bad case. should not **watch a data and refresh data** in selector!!
 * 	state.refresh(transform(data))
 * })
 */
export function useCompute<Type, Return = Type>(
	states: State<Type>,
	transform?: Transform<Type, Return>,
): Return;
export function useCompute<T1, T2, Return>(
	states: [State<T1>, State<T2>],
	transform?: Transform<[T1, T2], Return>,
): Return;
export function useCompute<T1, T2, T3, Return>(
	states: [State<T1>, State<T2>, State<T3>],
	transform?: Transform<[T1, T2, T3], Return>,
): Return;
export function useCompute<T1, T2, T3, T4, Return>(
	states: [State<T1>, State<T2>, State<T3>, State<T4>],
	transform?: Transform<[T1, T2, T3, T4], Return>,
): Return;
export function useCompute<Type>(
	states: State<Type>[] | State<Type>,
	// should not come from instance method
	transform = id,
) {
	const [, rerender] = useState(0);
	const forceRender = useCallback(() => rerender((i) => i + 1), []);

	const _states = Array.isArray(states) ? states : [states];
	const cache = useRef(NO_CACHE);

	const recompute = useCallback(() => {
		if (_states.length === 1) {
			cache.current = transform(_states[0].get());
		} else {
			cache.current = transform(_states.map((state) => state.get()));
		}
	}, _states);

	useMemo(() => recompute(), [recompute]);

	const disposers = useMemo(() => {
		const disposes = _states.map((state) =>
			state.register(() => {
				recompute();
				forceRender();
			}),
		);
		return () => disposes.forEach((dispose) => dispose());
	}, [..._states, forceRender, recompute]);

	useEffect(() => {
		return disposers;
	}, [disposers]);

	return cache.current;
}

export function watch<Type>(
	state: State<Type>,
	transform: Transform<Type, void>,
	options?: { fireImmediately: boolean },
) {
	const { fireImmediately } = options || {};
	const disposer = state.register(transform);

	if (fireImmediately) {
		transform(state.get());
	}

	return disposer;
}

// only use in class
export function read<Type, Return = Type>(
	state: State<Type>,
	transform: Transform<Type, Return> = id,
) {
	return transform(state.get());
}

export class Model {
	protected disposers: Func[] = [];

	dispose() {
		this.disposers.forEach((disposer) => disposer());
	}
}
