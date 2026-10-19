import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import {
  garantiasService,
  type DevolverGarantia,
  type ListaGarantias,
} from '../services/garantias.service';
import { clavesReservas } from './useReservas';

/** Claves de caché: cuelgan de `['reservas', condominio]` y siempre incluyen el condominio. */
export const clavesGarantias = {
  lista: (condominioId: number | null) => ['reservas', condominioId, 'garantias'] as const,
};

export function useListaGarantias(habilitado: Ref<boolean>) {
  const session = useSessionStore();

  return useQuery<ListaGarantias, ApiError>({
    queryKey: computed(() => clavesGarantias.lista(session.condominioId)),
    queryFn: () => garantiasService.lista(),
    enabled: computed(() => session.condominioId !== null && habilitado.value),
    refetchOnWindowFocus: true,
  });
}

/** Registrar una devolución mueve esta lista, la de daños y lo que ve el residente: se vuelve a pedir, también en error. */
export function useDevolverGarantia() {
  const session = useSessionStore();
  const queryClient = useQueryClient();

  return useMutation<
    void,
    ApiError,
    { reservaId: number; datos: DevolverGarantia },
    { condominioId: number | null }
  >({
    mutationFn: ({ reservaId, datos }) => garantiasService.devolver(reservaId, datos),
    onMutate: () => ({ condominioId: session.condominioId }),
    onSettled: (_datos, _error, _variables, contexto) => {
      if (contexto?.condominioId != null) {
        return queryClient.invalidateQueries({
          queryKey: clavesReservas.todas(contexto.condominioId),
        });
      }
      return undefined;
    },
  });
}
