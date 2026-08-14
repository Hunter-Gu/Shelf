import { storageLocal } from '~/storage-manager';

type Client = {
	clientId: string;
};

const KEY = 'clientId';

export async function getOrCreateClientId() {
	const result = await storageLocal.get<Client>(KEY);
	let clientId = result?.clientId;
	if (!clientId) {
		// Generate a unique client ID, the actual value is not relevant
		clientId = self.crypto.randomUUID();
		await storageLocal.set(KEY, { clientId });
	}
	return clientId;
}
