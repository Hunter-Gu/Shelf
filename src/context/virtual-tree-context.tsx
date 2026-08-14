import { noop } from 'common/utils/noop';
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

type VirtualTreeValue = {
	scrollToId(id: string): void;
};

type VirtualTreeRegisterValue = (value: VirtualTreeValue) => void;

const DEFAULT_VIRTUAL_TREE: VirtualTreeValue = { scrollToId() {} };

const VirtualTreeContext = createContext<VirtualTreeValue>(DEFAULT_VIRTUAL_TREE);
const VirtualTreeRegisterContext = createContext<VirtualTreeRegisterValue>(noop);

export function VirtualTreeProvider({ children }: PropsWithChildren<unknown>) {
	const [virtualTree, setVirtualTree] = useState<VirtualTreeValue>(DEFAULT_VIRTUAL_TREE);

	useEffect(() => {
		return () => {
			setVirtualTree({
				scrollToId: noop,
			});
		};
	}, []);

	return (
		<VirtualTreeContext.Provider value={virtualTree}>
			<VirtualTreeRegisterContext.Provider value={setVirtualTree}>
				{children}
			</VirtualTreeRegisterContext.Provider>
		</VirtualTreeContext.Provider>
	);
}

export function useVirtualTree() {
	return useContext(VirtualTreeContext);
}

export function useVirtualTreeRegister() {
	return useContext(VirtualTreeRegisterContext);
}
