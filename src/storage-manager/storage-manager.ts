import { ChromeStorage } from './chrome-storage';
import { StorageUtils } from './storage-utils';
import type { StorageData } from './types';

export class StorageManager<T> {
	private chromeStorage: ChromeStorage<StorageData<T>>;

	private storageUtils = new StorageUtils<T>();

	constructor(name: string) {
		this.chromeStorage = new ChromeStorage<StorageData<T>>(name);
	}

	save(data: T) {
		return this.chromeStorage.save(this.storageUtils.format(data));
	}

	async get() {
		const data = await this.chromeStorage.get();
		if (data) {
			return this.storageUtils.parse(data);
		}
	}

	remove() {
		return this.chromeStorage.remove();
	}

	async update(data: T) {
		await this.remove();
		return this.save(data);
	}
}
