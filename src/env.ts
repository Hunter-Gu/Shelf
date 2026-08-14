export const isExtensionEnv = !!chrome?.runtime;
export const isDevEnv = process.env.NODE_ENV === 'development';
export const enableDirectCall = JSON.parse(process.env.PLASMO_PUBLIC_DIRECT_API_CALL || 'false');
