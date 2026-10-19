import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import {
  danosService,
  type DetalleDanos,
  type ListaDanos,
  type ResolverDanos,
} from '../services/danos.service';
import { clavesReservas } from './useReservas';

/** Claves de caché de los daños: cuelgan de `['reservas', condominio]` y siempre incluyen el condominio. */
export const clavesDanos = {
  lista: (condominioId: number | null) => ['reservas', condominioId, 'danos'] as const,
  detalle: (condominioId: number | null, reservaId: number | null) =>
    ['reservas', condominioId, 'danos', reservaId] as const,
};

export function useListaDanos(habilitado: Ref<boolean>) {
  const session = useSessionStore();

  return useQuery<ListaDanos, ApiError>({
    queryKey: computed(() => clavesDanos.lista(session.condominioId)),
    queryFn: () => danosService.lista(),
    enabled: computed(() => session.condominioId !== null && habilitado.value),
    refetchOnWindowFocus: true,
  });
}

export function useDetalleDanos(reservaId: Ref<number | null>) {
  const session = useSessionStore();

  return useQuery<DetalleDanos, ApiError>({
    queryKey: computed(() => clavesDanos.detalle(session.condominioId, reservaId.value)),
    queryFn: () => danosService.detalle(reservaId.value as number),
    enabled: computed(() => session.condominioId !== null && reservaId.value !== null),
    // Trae enlaces temporales a las fotos: no se reusan de la caché
    gcTime: 0,
  });
}

/** Decidir mueve la lista y, si se cobra, la cuenta de la unidad: se vuelve a pedir, también en error. */
export function useResolverDanos() {
  const session = useSessionStore();
  const queryClient = useQueryClient();

  return useMutation<
    DetalleDanos,
    ApiError,
    { reservaId: number; datos: ResolverDanos },
    { condominioId: number | null }
  >({
    mutationFn: ({ reservaId, datos }) => danosService.resolver(reservaId, datos),
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
