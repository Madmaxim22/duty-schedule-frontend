import { apiRequest } from './client';
import type {
  AppVersionInfo,
  OnboardingResponse,
  ReleasesResponse,
} from './types';

export function fetchAppVersion() {
  return apiRequest<AppVersionInfo>('/version');
}

export function fetchReleases() {
  return apiRequest<ReleasesResponse>('/releases');
}

export function fetchOnboarding() {
  return apiRequest<OnboardingResponse>('/onboarding');
}

export function acknowledgeRelease(releaseId: string) {
  return apiRequest('/onboarding/release-ack', {
    method: 'POST',
    body: JSON.stringify({ releaseId }),
  });
}

export function markAchievementsSeen(period: string, achievementIds?: string[]) {
  return apiRequest('/onboarding/achievements/seen', {
    method: 'POST',
    body: JSON.stringify({ period, achievementIds }),
  });
}
