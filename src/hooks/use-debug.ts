import { useEffect } from 'react';

export function useDebug(states: any[]) {
	states.forEach((state, i) => {
		useEffect(() => {
			console.log(i, 'changed:', state);
		}, [state]);
	});
}
