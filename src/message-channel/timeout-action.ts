export function timeoutAction<Action extends Func>({
	action,
	timeout,
	ms,
}: {
	action: Action;
	timeout: () => void;
	ms: number;
}) {
	let done = false;

	const timeoutAction = createAction(timeout);
	const timeId = setTimeout(timeoutAction, ms);

	return createAction(action);

	function createAction<Action extends Func>(action: Action) {
		return function (...params: Parameters<Action>) {
			if (done) {
				return;
			}
			done = true;
			clearTimeout(timeId);
			action(...params);
		};
	}
}
