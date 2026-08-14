import type { Payload } from './types';

export class PortMessage {
	constructor(private _port: chrome.runtime.Port) {}

	on(name: PropertyKey, handler: (payload: Payload) => void) {
		const _handler = (payload: Payload) => {
			if (payload.name !== name) {
				return;
			}

			handler(payload);
		};
		this._port.onMessage.addListener(_handler);

		return () => this._port.onMessage.removeListener(_handler);
	}

	emit(payload: Payload) {
		this._port.postMessage(payload);
	}

	disconnect() {
		this._port.disconnect();
	}

	onDisconnect(handler: () => void) {
		this._port.onDisconnect.addListener(handler);
		return () => this._port.onDisconnect.removeListener(handler);
	}
}

function isPort(
	data: chrome.runtime.ConnectInfo | chrome.runtime.Port,
): data is chrome.runtime.Port {
	return 'postMessage' in data;
}

export class PortConnect {
	private disposers: Func[] = [];
	private ports: PortMessage[] = [];

	connect(connectInfo: chrome.runtime.ConnectInfo): PortMessage;
	connect(port: chrome.runtime.Port): PortMessage;
	connect(data: chrome.runtime.ConnectInfo | chrome.runtime.Port) {
		const _port = isPort(data) ? data : chrome.runtime.connect(data);
		const port = new PortMessage(_port as chrome.runtime.Port);

		this.ports.push(port);

		const off = port.onDisconnect(() => {
			const index = this.ports.indexOf(port);
			this.ports.splice(index, 1);
			off();
		});

		return port;
	}

	onConnect(name: PropertyKey, handler: (port: PortMessage) => void) {
		const _handler = (port: chrome.runtime.Port) => {
			if (name !== port.name) {
				return;
			}

			handler(this.connect(port));
		};

		chrome.runtime.onConnect.addListener(_handler);

		const disposer = () => {
			chrome.runtime.onConnect.removeListener(_handler);
		};

		this.disposers.push(disposer);

		return () => {
			disposer();
			const index = this.disposers.indexOf(disposer);
			this.disposers.splice(index, 1);
		};
	}

	dispose() {
		this.disposers.forEach((disposer) => disposer());
		this.ports.forEach((port) => port.disconnect());
	}
}
