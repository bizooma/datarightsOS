import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

const APP_ID = appId || '6a3735f4f27dcb14405892ae';

//Create a client with authentication required
export const base44 = createClient({
  appId: APP_ID,
  token,
  functionsVersion,
  serverUrl: appBaseUrl || 'https://api.base44.app',
  requiresAuth: false,
  appBaseUrl: appBaseUrl || 'https://api.base44.app'
});