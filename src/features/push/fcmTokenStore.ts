let currentFcmToken: string | null = null;

export function setStoredFcmToken(token: string | null): void {
  currentFcmToken = token;
}

export function getStoredFcmToken(): string | null {
  return currentFcmToken;
}
