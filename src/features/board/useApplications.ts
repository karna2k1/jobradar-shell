import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { coreApi } from '../../lib/api';
import type { Application, Stage } from '../../lib/types';

const KEY = ['applications'];

export function useApplications() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => (await coreApi.get<Application[]>('/applications')).data,
  });
}

/** Optimistic move: the card jumps immediately, the server response then replaces it. */
export function useMoveApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { id: number; stage: Stage; position: number | null }) =>
      (await coreApi.patch<Application>(`/applications/${v.id}/move`, { stage: v.stage, position: v.position })).data,
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: KEY });
      const previous = qc.getQueryData<Application[]>(KEY);
      qc.setQueryData<Application[]>(KEY, (list = []) => {
        const maxInStage = Math.max(0, ...list.filter((a) => a.stage === v.stage).map((a) => a.position));
        return list.map((a) => (a.id === v.id ? { ...a, stage: v.stage, position: v.position ?? maxInStage + 1024 } : a));
      });
      return { previous };
    },
    onError: (_e, _v, ctx) => ctx?.previous && qc.setQueryData(KEY, ctx.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useCreateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { company: string; title: string; jobUrl?: string; location?: string; stage?: Stage }) =>
      (await coreApi.post<Application>('/applications', body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: number; notes?: string; followUpAt?: string | null; jobUrl?: string }) =>
      (await coreApi.patch<Application>(`/applications/${id}`, body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => coreApi.delete(`/applications/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
