const STORAGE_KEY = 'duty_fcm_token';

let currentFcmToken: string | null = null;

function readFromStorage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeToStorage(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(STORAGE_KEY, token);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* ignore quota / private mode */
  }
}

export function setStoredFcmToken(token: string | null): void {
  currentFcmToken = token;
  writeToStorage(token);
}

export function getStoredFcmToken(): string | null {
  if (currentFcmToken) {
    return currentFcmToken;
  }
  currentFcmToken = readFromStorage();
  return currentFcmToken;
}
