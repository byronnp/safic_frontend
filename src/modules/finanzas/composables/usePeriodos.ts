import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import {
  periodosService,
  type EmisionPeriodo,
  type PeriodoFinanciero,
  type ResumenFinanciero,
} from '../services/periodos.service';

/** Claves de caché: siempre incluyen el condominio activo. */
export const clavesFinanzas = {
  todas: (condominioId: number | null) => ['finanzas', condominioId] as const,
  periodos: (condominioId: number | null) => ['finanzas', condominioId, 'periodos'] as const,
  resumen: (condominioId: number | null, periodo: string | null) =>
    ['finanzas', condominioId, 'resumen', periodo ?? 'en-curso'] as const,
};

export function usePeriodos() {
  const session = useSessionStore();

  return useQuery<PeriodoFinanciero[], ApiError>({
    queryKey: computed(() => clavesFinanzas.periodos(session.condominioId)),
    queryFn: () => periodosService.listar(),
    enabled: computed(() => session.condominioId !== null),
    refetchOnWindowFocus: false,
  });
}

/** `periodo` null = el mes en curso del condominio. */
export function useResumenFinanciero(periodo: Ref<string | null>) {
  const session = useSessionStore();

  return useQuery<ResumenFinanciero, ApiError>({
    queryKey: computed(() => clavesFinanzas.resumen(session.condominioId, periodo.value)),
    queryFn: () => periodosService.resumen(periodo.value ?? undefined),
    enabled: computed(() => session.condominioId !== null),
    refetchOnWindowFocus: false,
  });
}

export function useEmitirPeriodo() {
  const session = useSessionStore();
  const queryClient = useQueryClient();

  return useMutation<EmisionPeriodo, ApiError, string, { condominioId: number | null }>({
    mutationFn: (periodo) => periodosService.emitir(periodo),
    // El condominio de la petición, no el de cuando responde
    onMutate: () => ({ condominioId: session.condominioId }),
    onSettled: (_datos, _error, _periodo, contexto) => {
      const condominioId = contexto?.condominioId ?? null;
      if (condominioId === null) return;
      return queryClient.invalidateQueries({ queryKey: clavesFinanzas.todas(condominioId) });
    },
  });
}
