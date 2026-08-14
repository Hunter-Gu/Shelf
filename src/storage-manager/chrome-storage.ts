import { Storage } from '@plasmohq/storage';

export interface IStorage<Data> {
	save(data: Data): void | null | Promise<void | null>;

	get(): Data | Promise<Data | undefined>;

	update(data: Data): void | null | Promise<void | null>;

	remove(): void | Promise<void>;

	clearAll(): void | Promise<void>;
}

const storage = new Storage({
	area: 'sync',
});

export class ChromeStorage<Data> implements IStorage<Data> {
	constructor(private readonly _key: string) {}

	save(data: Data) {
		return storage.set(this._key, data);
	}

	get() {
		return storage.get<Data>(this._key);
	}

	remove() {
		return storage.remove(this._key);
	}

	async update(data: Data) {
		await this.remove();
		return this.save(data);
	}

	clearAll() {
		return storage.clear();
	}
}
