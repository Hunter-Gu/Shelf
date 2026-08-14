import { isDevEnv, isExtensionEnv } from '~/env';

export const platform = isExtensionEnv ? 'extension' : 'web';
export const env = isDevEnv ? 'dev' : 'prod';
