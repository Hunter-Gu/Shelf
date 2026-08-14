export class Message {
	private handlers: Array<(payload: unknown, sender: object, respond: Func) => void> = [];

	emit = (extensionId: string, payload: unknown, respond = () => {}) => {
		this.handlers.forEach((handler) => {
			handler(payload, {}, respond);
		});
	};

	on = (handler: Func) => {
		this.handlers.push(handler);
	};

	off = (handler: Func) => {
		const index = this.handlers.indexOf(handler);
		this.handlers.splice(index, 1);
	};
}

class ConnectMessage {
	private handlers: Array<Func> = [];

	emit = (payload: unknown) => {
		this.handlers.forEach((handler) => {
			handler(payload);
		});
	};

	on = (handler: Func) => {
		this.handlers.push(handler);
	};

	off = (handler: Func) => {
		const index = this.handlers.indexOf(handler);
		this.handlers.splice(index, 1);
	};
}

const connect = new ConnectMessage();
export class Connect {
	onConnect = {
		addListener: connect.on,
		removeListener: connect.off,
	};

	connect = ({ name }: { name: string }) => {
		const message1 = new ConnectMessage();
		const message2 = new ConnectMessage();
		const disconnect = new ConnectMessage();

		const port = {
			name,

			postMessage: message1.emit,
			onMessage: {
				addListener: message2.on,
				removeListener: message2.off,
			},

			disconnect: disconnect.emit,
			onDisconnect: {
				addListener: disconnect.on,
				removeListener: disconnect.off,
			},
		};

		const copyPort = {
			name,

			postMessage: message2.emit,
			onMessage: {
				addListener: message1.on,
				removeListener: message1.off,
			},

			disconnect: disconnect.emit,
			onDisconnect: {
				addListener: disconnect.on,
				removeListener: disconnect.off,
			},
		};

		connect.emit(copyPort);

		return port;
	};
}

export function setup() {
	const message = new Message();
	const connectMessage = new Connect();

	global.chrome = {
		runtime: {
			sendMessage: message.emit,
			onMessage: {
				addListener: message.on,
				removeListener: message.off,
			},
			connect: connectMessage.connect,
			onConnect: connectMessage.onConnect,
		},
	};
}

setup();
