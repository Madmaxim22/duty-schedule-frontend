export function resolveAvatarUrl(url: string | null | undefined, cacheBust?: number) {
  if (!url) return undefined;
  const base = import.meta.env.VITE_API_URL ?? '';
  const path = url.startsWith('http') ? url : `${base}${url}`;
  if (cacheBust) {
    return `${path}${path.includes('?') ? '&' : '?'}v=${cacheBust}`;
  }
  return path;
}
