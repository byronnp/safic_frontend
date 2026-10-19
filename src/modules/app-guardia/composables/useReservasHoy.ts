import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import { reservasHoyService, type ReservasHoy } from '../services/reservas-hoy.service';

/** Claves de caché: incluyen el condominio y cuelgan de `['reservas', condominio]`. */
export const clavesReservasHoy = {
  hoy: (condominioId: number | null) => ['reservas', condominioId, 'hoy'] as const,
  todas: (condominioId: number | null) => ['reservas', condominioId] as const,
};

export function useReservasHoy() {
  const session = useSessionStore();

  return useQuery<ReservasHoy, ApiError>({
    queryKey: computed(() => clavesReservasHoy.hoy(session.condominioId)),
    queryFn: () => reservasHoyService.hoy(),
    enabled: computed(() => session.condominioId !== null),
    // La garita lo deja abierto horas: se refresca solo y al volver a la pantalla
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

/** Cada cambio mueve la lista de hoy y lo que ven residentes y administración: se vuelve a pedir, también en error. */
function useMutacionHoy<TVariables>(ejecutar: (variables: TVariables) => Promise<void>) {
  const session = useSessionStore();
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, TVariables, { condominioId: number | null }>({
    mutationFn: ejecutar,
    onMutate: () => ({ condominioId: session.condominioId }),
    onSettled: (_datos, _error, _variables, contexto) => {
      if (contexto?.condominioId != null) {
        return queryClient.invalidateQueries({
          queryKey: clavesReservasHoy.todas(contexto.condominioId),
        });
      }
      return undefined;
    },
  });
}

export function useRegistrarIngreso() {
  return useMutacionHoy<number>((id) => reservasHoyService.ingreso(id));
}

export function useRecibirArea() {
  return useMutacionHoy<{ id: number; danos: string | null; fotos?: readonly File[] }>(
    ({ id, danos, fotos }) => reservasHoyService.entrega(id, danos, fotos),
  );
}
