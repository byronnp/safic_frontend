import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import {
  reservasService,
  type AreasReservables,
  type DiaDisponible,
  type MiReserva,
  type NuevaReserva,
} from '../services/reservas.service';

/** Claves de caché: siempre incluyen el condominio activo. */
export const clavesReservas = {
  todas: (condominioId: number | null) => ['reservas', condominioId] as const,
  areas: (condominioId: number | null) => ['reservas', condominioId, 'areas'] as const,
  mias: (condominioId: number | null) => ['reservas', condominioId, 'mias'] as const,
  disponibilidad: (condominioId: number | null, amenidadId: number, desde: string) =>
    ['reservas', condominioId, 'disponibilidad', amenidadId, desde] as const,
};

export function useAreasReservables() {
  const session = useSessionStore();

  return useQuery<AreasReservables, ApiError>({
    queryKey: computed(() => clavesReservas.areas(session.condominioId)),
    queryFn: () => reservasService.areas(),
    enabled: computed(() => session.condominioId !== null),
    refetchOnWindowFocus: false,
  });
}

export function useDisponibilidad(amenidadId: Ref<number | null>, desde: Ref<string>) {
  const session = useSessionStore();

  return useQuery<DiaDisponible[], ApiError>({
    queryKey: computed(() =>
      clavesReservas.disponibilidad(session.condominioId, amenidadId.value ?? 0, desde.value),
    ),
    queryFn: () => reservasService.disponibilidad(amenidadId.value ?? 0, desde.value, 7),
    enabled: computed(() => session.condominioId !== null && amenidadId.value !== null),
    // Los horarios cambian con cada reserva de los vecinos: no se reusan de la caché
    gcTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useMisReservas() {
  const session = useSessionStore();

  return useQuery<MiReserva[], ApiError>({
    queryKey: computed(() => clavesReservas.mias(session.condominioId)),
    queryFn: () => reservasService.mias(),
    enabled: computed(() => session.condominioId !== null),
    refetchOnWindowFocus: false,
  });
}

/** Cada cambio mueve la disponibilidad y mis reservas: se vuelve a pedir lo del condominio, también en error. */
function useMutacionReservas<TDatos, TVariables>(
  ejecutar: (variables: TVariables) => Promise<TDatos>,
) {
  const session = useSessionStore();
  const queryClient = useQueryClient();

  return useMutation<TDatos, ApiError, TVariables, { condominioId: number | null }>({
    mutationFn: ejecutar,
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

export function useReservarArea() {
  return useMutacionReservas<MiReserva, NuevaReserva>((d) => reservasService.reservar(d));
}

export function useCancelarReserva() {
  return useMutacionReservas<void, { id: number; motivo: string | null }>(({ id, motivo }) =>
    reservasService.cancelar(id, motivo),
  );
}
