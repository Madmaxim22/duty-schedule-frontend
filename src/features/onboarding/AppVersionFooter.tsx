import { useQuery } from '@tanstack/react-query';
import { fetchAppVersion } from '@/shared/api/onboarding';

export function AppVersionFooter() {
  const { data } = useQuery({
    queryKey: ['app-version'],
    queryFn: fetchAppVersion,
    staleTime: 300_000,
    retry: false,
  });

  if (!data?.version) return null;

  return <span className="app-shell__version">Версия {data.version}</span>;
}
