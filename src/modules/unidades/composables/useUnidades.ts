import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import {
  unidadesService,
  type FiltroUnidades,
  type GuardarUnidad,
  type PaginaUnidades,
  type ResumenUnidades,
  type Unidad,
} from '../services/unidades.service';

/** Claves de caché: siempre incluyen el condominio activo. */
export const clavesUnidades = {
  todas: (condominioId: number | null) => ['unidades', condominioId] as const,
  lista: (condominioId: number | null, filtro: FiltroUnidades) =>
    ['unidades', condominioId, 'lista', filtro] as const,
  resumen: (condominioId: number | null) => ['unidades', condominioId, 'resumen'] as const,
};

export function useUnidades(filtro: Ref<FiltroUnidades>) {
  const session = useSessionStore();

  return useQuery<PaginaUnidades, ApiError>({
    queryKey: computed(() => clavesUnidades.lista(session.condominioId, { ...filtro.value })),
    queryFn: () => unidadesService.listar(filtro.value),
    enabled: computed(() => session.condominioId !== null),
    placeholderData: (anterior) => anterior,
  });
}

export function useResumenUnidades() {
  const session = useSessionStore();

  return useQuery<ResumenUnidades, ApiError>({
    queryKey: computed(() => clavesUnidades.resumen(session.condominioId)),
    queryFn: () => unidadesService.resumen(),
    enabled: computed(() => session.condominioId !== null),
  });
}

export function useCrearUnidad() {
  const session = useSessionStore();
  const queryClient = useQueryClient();

  return useMutation<Unidad, ApiError, GuardarUnidad>({
    mutationFn: (datos) => unidadesService.crear(datos),
    // Lista y resumen (cupo, suma de alícuotas) cambian con cada alta
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: clavesUnidades.todas(session.condominioId) }),
  });
}
