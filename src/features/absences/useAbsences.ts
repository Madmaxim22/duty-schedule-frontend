import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/shared/api/client';
import type {
  AbsenceRecord,
  DeleteAbsencesResult,
  UpsertAbsencesResult,
} from '@/shared/api/types';

export function absencesQueryKey(from: string, to: string, userId?: string) {
  return ['admin', 'absences', from, to, userId ?? 'all'] as const;
}

export function useAbsenceTypesQuery() {
  return useQuery({
    queryKey: ['admin', 'absences', 'types'],
    queryFn: () => apiRequest<{ types: string[] }>('/admin/absences/types'),
  });
}

export function useAbsencesQuery(from: string, to: string, userId?: string) {
  const params = new URLSearchParams({ from, to });
  if (userId) params.set('userId', userId);

  return useQuery({
    queryKey: absencesQueryKey(from, to, userId),
    queryFn: () =>
      apiRequest<{ absences: AbsenceRecord[] }>(`/admin/absences?${params.toString()}`),
    enabled: Boolean(from && to),
  });
}

function invalidateAbsenceQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['admin', 'absences'] });
  void queryClient.invalidateQueries({ queryKey: ['schedule'] });
  void queryClient.invalidateQueries({ queryKey: ['admin', 'statistics'] });
}

export function useUpsertAbsencesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: {
      userId: string;
      dateFrom: string;
      dateTo: string;
      absenceType: string;
    }) =>
      apiRequest<UpsertAbsencesResult>('/admin/absences', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => invalidateAbsenceQueries(queryClient),
  });
}

export function useDeleteAbsencesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { userId: string; dateFrom: string; dateTo: string }) =>
      apiRequest<DeleteAbsencesResult>('/admin/absences', {
        method: 'DELETE',
        body: JSON.stringify(body),
      }),
    onSuccess: () => invalidateAbsenceQueries(queryClient),
  });
}
