import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import { reglasFinanzasService, type ReglasFinanzas } from '../services/reglas-finanzas.service';

/** Clave de caché: siempre incluye el condominio activo. */
export const clavesReglasFinanzas = {
  todas: (condominioId: number | null) => ['reglas-finanzas', condominioId] as const,
};

export function useReglasFinanzas() {
  const session = useSessionStore();

  return useQuery<ReglasFinanzas, ApiError>({
    queryKey: computed(() => clavesReglasFinanzas.todas(session.condominioId)),
    queryFn: () => reglasFinanzasService.ver(),
    enabled: computed(() => session.condominioId !== null),
    refetchOnWindowFocus: false,
  });
}

export function useGuardarReglasFinanzas() {
  const session = useSessionStore();
  const queryClient = useQueryClient();

  return useMutation<
    ReglasFinanzas,
    ApiError,
    Partial<ReglasFinanzas>,
    { condominioId: number | null }
  >({
    mutationFn: (cambios) => reglasFinanzasService.guardar(cambios),
    onMutate: () => ({ condominioId: session.condominioId }),
    // También en error: el cambio pudo guardarse aunque la respuesta falle
    onSettled: (_datos, _error, _variables, contexto) => {
      if (contexto?.condominioId != null) {
        return queryClient.invalidateQueries({
          queryKey: clavesReglasFinanzas.todas(contexto.condominioId),
        });
      }
      return undefined;
    },
  });
}
