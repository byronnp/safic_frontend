import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import { areasService, type AreaComun, type ReglasAreaEntrada } from '../services/areas.service';

/** Claves de caché: siempre incluyen el condominio activo. */
export const clavesAreas = {
  todas: (condominioId: number | null) => ['areas-comunes', condominioId] as const,
  lista: (condominioId: number | null) => ['areas-comunes', condominioId, 'areas'] as const,
};

export function useAreas() {
  const session = useSessionStore();

  return useQuery<AreaComun[], ApiError>({
    queryKey: computed(() => clavesAreas.lista(session.condominioId)),
    queryFn: () => areasService.listar(),
    enabled: computed(() => session.condominioId !== null),
    refetchOnWindowFocus: false,
  });
}

export function useGuardarReglasArea() {
  const session = useSessionStore();
  const queryClient = useQueryClient();

  return useMutation<
    AreaComun,
    ApiError,
    { id: number; reglas: ReglasAreaEntrada },
    { condominioId: number | null }
  >({
    mutationFn: ({ id, reglas }) => areasService.guardarReglas(id, reglas),
    onMutate: () => ({ condominioId: session.condominioId }),
    // También en error: si el guardado llegó pero la respuesta no, la lista se vuelve a pedir
    onSettled: (_datos, _error, _variables, contexto) => {
      if (contexto?.condominioId != null) {
        return queryClient.invalidateQueries({
          queryKey: clavesAreas.todas(contexto.condominioId),
        });
      }
      return undefined;
    },
  });
}
