import { Preferences } from '@capacitor/preferences';
import { isNativeApp } from '@/shared/capacitor/isNativeApp';

const TOKEN_KEY = 'duty_fcm_token';
const SUBSCRIBED_KEY = 'duty_fcm_subscribed';

let cachedToken: string | null | undefined;
let cachedSubscribed: boolean | undefined;

async function readNative(key: string): Promise<string | null> {
  const { value } = await Preferences.get({ key });
  return value;
}

async function writeNative(key: string, value: string | null): Promise<void> {
  if (value) {
    await Preferences.set({ key, value });
  } else {
    await Preferences.remove({ key });
  }
}

export async function getStoredFcmToken(): Promise<string | null> {
  if (cachedToken !== undefined) {
    return cachedToken;
  }

  if (isNativeApp()) {
    cachedToken = await readNative(TOKEN_KEY);
    return cachedToken;
  }

  try {
    cachedToken = localStorage.getItem(TOKEN_KEY);
  } catch {
    cachedToken = null;
  }
  return cachedToken;
}

export async function setStoredFcmToken(token: string | null): Promise<void> {
  cachedToken = token;

  if (isNativeApp()) {
    await writeNative(TOKEN_KEY, token);
    return;
  }

  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    /* ignore */
  }
}

export async function getFcmSubscribedFlag(): Promise<boolean> {
  if (cachedSubscribed !== undefined) {
    return cachedSubscribed;
  }

  if (isNativeApp()) {
    const value = await readNative(SUBSCRIBED_KEY);
    cachedSubscribed = value === '1';
    return cachedSubscribed;
  }

  cachedSubscribed = false;
  return false;
}

export async function setFcmSubscribedFlag(subscribed: boolean): Promise<void> {
  cachedSubscribed = subscribed;

  if (!isNativeApp()) {
    return;
  }

  await writeNative(SUBSCRIBED_KEY, subscribed ? '1' : null);
}

export async function clearFcmPushLocalState(): Promise<void> {
  cachedToken = null;
  cachedSubscribed = false;
  await setStoredFcmToken(null);
  await setFcmSubscribedFlag(false);
}
