declare namespace NodeJS {
	interface ProcessEnv {
		PLASMO_PUBLIC_GTAG_ID?: string;
		PLASMO_PUBLIC_API_SECRET?: string;
	}
}

interface Window {
	dataLayer?: Array;
	gtag?: (a: string, ...args: unknown[]) => void;
}

type SafeAny = any;

type Func = (...args: SafeAny[]) => void;
