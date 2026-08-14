import type { StorageData } from './types';

export class StorageUtils<T> {
	private version = '0.0.1';

	format(data: T): StorageData<T> {
		return {
			version: this.version,
			data,
		};
	}

	parse({ data }: StorageData<T>) {
		return data;
	}
}
