import { storageLocal } from '~/storage-manager';

const SESSION_EXPIRATION_IN_MIN = 30;

type SessionData = {
	session_id: string;
	timestamp: string | number;
};

const KEY = 'sessionData';

export async function getOrCreateSessionId(): Promise<string> {
	// Store session in memory storage
	let sessionData: SessionData | null | undefined = await storageLocal.get<SessionData>(KEY);
	// Check if session exists and is still valid
	const currentTimeInMs = Date.now();
	if (sessionData && sessionData.timestamp) {
		// Calculate how long ago the session was last updated
		const durationInMin = (currentTimeInMs - Number(sessionData.timestamp)) / 60000;
		// Check if last update lays past the session expiration threshold
		if (durationInMin > SESSION_EXPIRATION_IN_MIN) {
			// Delete old session id to start a new session
			sessionData = null;
		} else {
			// Update timestamp to keep session alive
			sessionData.timestamp = currentTimeInMs;
			await storageLocal.set(KEY, sessionData);
		}
	}
	if (!sessionData) {
		// Create and store a new session
		sessionData = {
			session_id: currentTimeInMs.toString(),
			timestamp: currentTimeInMs.toString(),
		};
		await storageLocal.set(KEY, sessionData);
	}
	return sessionData.session_id;
}
