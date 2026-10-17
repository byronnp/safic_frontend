import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import {
  agendaService,
  type Agenda,
  type NuevoBloqueo,
  type Solicitud,
} from '../services/agenda.service';
import { clavesReservas } from './useReservas';

/** Claves de caché de la administración: cuelgan de `['reservas', condominio]` y siempre incluyen el condominio. */
export const clavesAgenda = {
  agenda: (condominioId: number | null, desde: string) =>
    ['reservas', condominioId, 'agenda', desde] as const,
  solicitudes: (condominioId: number | null) => ['reservas', condominioId, 'solicitudes'] as const,
};

export function useAgenda(desde: Ref<string>) {
  const session = useSessionStore();

  return useQuery<Agenda, ApiError>({
    queryKey: computed(() => clavesAgenda.agenda(session.condominioId, desde.value)),
    queryFn: () => agendaService.agenda(desde.value, 7),
    enabled: computed(() => session.condominioId !== null),
    refetchOnWindowFocus: true,
  });
}

export function useSolicitudes() {
  const session = useSessionStore();

  return useQuery<Solicitud[], ApiError>({
    queryKey: computed(() => clavesAgenda.solicitudes(session.condominioId)),
    queryFn: () => agendaService.solicitudes(),
    enabled: computed(() => session.condominioId !== null),
    refetchOnWindowFocus: true,
  });
}

/** Cada cambio mueve la agenda, las solicitudes y lo que ve el residente: se vuelve a pedir, también en error. */
function useMutacionAgenda<TDatos, TVariables>(
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

export function useAprobarReserva() {
  return useMutacionAgenda<void, number>((id) => agendaService.aprobar(id));
}

export function useRechazarReserva() {
  return useMutacionAgenda<void, { id: number; motivo: string }>(({ id, motivo }) =>
    agendaService.rechazar(id, motivo),
  );
}

export function useCancelarReservaAdmin() {
  return useMutacionAgenda<void, { id: number; motivo: string }>(({ id, motivo }) =>
    agendaService.cancelar(id, motivo),
  );
}

export function useBloquearArea() {
  return useMutacionAgenda<{ reservasCanceladas: number }, NuevoBloqueo>((d) =>
    agendaService.bloquear(d),
  );
}

export function useQuitarBloqueo() {
  return useMutacionAgenda<void, number>((id) => agendaService.desbloquear(id));
}
