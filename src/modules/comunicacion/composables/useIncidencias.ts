import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import {
  incidenciasService,
  type CategoriaIncidencia,
  type EstadoIncidencia,
  type IncidenciaDetalle,
  type NuevaIncidencia,
  type PrioridadIncidencia,
  type TableroIncidencias,
} from '../services/incidencias.service';

/** Claves de caché: siempre incluyen el condominio activo. */
export const clavesIncidencias = {
  todas: (condominioId: number | null) => ['comunicacion', condominioId, 'incidencias'] as const,
  tablero: (condominioId: number | null) =>
    ['comunicacion', condominioId, 'incidencias', 'tablero'] as const,
  detalle: (condominioId: number | null, id: number) =>
    ['comunicacion', condominioId, 'incidencias', 'detalle', id] as const,
  mias: (condominioId: number | null) =>
    ['comunicacion', condominioId, 'incidencias', 'mias'] as const,
};

export function useTableroIncidencias() {
  const session = useSessionStore();

  return useQuery<TableroIncidencias, ApiError>({
    queryKey: computed(() => clavesIncidencias.tablero(session.condominioId)),
    queryFn: () => incidenciasService.tablero(),
    enabled: computed(() => session.condominioId !== null),
    refetchOnWindowFocus: true,
  });
}

export function useDetalleIncidencia(id: Ref<number | null>) {
  const session = useSessionStore();

  return useQuery<IncidenciaDetalle, ApiError>({
    queryKey: computed(() => clavesIncidencias.detalle(session.condominioId, id.value ?? 0)),
    queryFn: () => incidenciasService.detalle(id.value ?? 0),
    enabled: computed(() => session.condominioId !== null && id.value !== null),
    // Trae enlaces temporales a las fotos y notas internas: no se dejan en caché
    gcTime: 0,
  });
}

export function useMisIncidencias() {
  const session = useSessionStore();

  return useQuery<IncidenciaDetalle[], ApiError>({
    queryKey: computed(() => clavesIncidencias.mias(session.condominioId)),
    queryFn: () => incidenciasService.mias(),
    enabled: computed(() => session.condominioId !== null),
    refetchOnWindowFocus: true,
    gcTime: 0,
  });
}

/** Cada cambio mueve el tablero, el detalle y lo que ve el residente: se vuelve a pedir, también en error. */
function useMutacionIncidencias<TDatos, TVariables>(
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
          queryKey: clavesIncidencias.todas(contexto.condominioId),
        });
      }
      return undefined;
    },
  });
}

export function useComentarIncidencia() {
  return useMutacionIncidencias<void, { id: number; texto: string; interna: boolean }>(
    ({ id, texto, interna }) => incidenciasService.comentar(id, texto, interna),
  );
}

export function useCambiarEstadoIncidencia() {
  return useMutacionIncidencias<void, { id: number; estado: EstadoIncidencia }>(({ id, estado }) =>
    incidenciasService.cambiarEstado(id, estado),
  );
}

export function useAjustarIncidencia() {
  return useMutacionIncidencias<
    void,
    { id: number; cambios: { prioridad?: PrioridadIncidencia; categoria?: CategoriaIncidencia } }
  >(({ id, cambios }) => incidenciasService.ajustar(id, cambios));
}

export function useReportarIncidencia() {
  return useMutacionIncidencias<{ numero: number }, NuevaIncidencia>((d) =>
    incidenciasService.reportar(d),
  );
}

export function useComentarMiIncidencia() {
  return useMutacionIncidencias<void, { id: number; texto: string }>(({ id, texto }) =>
    incidenciasService.comentarMia(id, texto),
  );
}

export function useReabrirIncidencia() {
  return useMutacionIncidencias<void, { id: number; texto: string | null }>(({ id, texto }) =>
    incidenciasService.reabrir(id, texto),
  );
}

export function useConfirmarIncidencia() {
  return useMutacionIncidencias<void, number>((id) => incidenciasService.confirmar(id));
}
