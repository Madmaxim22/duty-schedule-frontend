import { useQuery } from '@tanstack/react-query';
import { fetchAppVersion } from '@/shared/api/onboarding';

type Props = {
  className?: string;
};

export function AppVersionFooter({ className = 'side-menu__version' }: Props) {
  const { data } = useQuery({
    queryKey: ['app-version'],
    queryFn: fetchAppVersion,
    staleTime: 300_000,
    retry: false,
  });

  if (!data?.version) return null;

  return <span className={className}>Версия {data.version}</span>;
}
