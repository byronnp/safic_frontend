import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import {
  asambleasService,
  type AnticipacionConvocatoria,
  type AsambleaDetalle,
  type AsambleaResumen,
  type ConfiguracionAsambleas,
  type EstadoAsamblea,
  type GuardarAsamblea,
  type GuardarPunto,
  type PadronAsamblea,
} from '../services/asambleas.service';

/** Claves de caché: siempre incluyen el condominio activo. */
export const clavesAsambleas = {
  todas: (condominioId: number | null) => ['asambleas', condominioId] as const,
  lista: (condominioId: number | null, estado: EstadoAsamblea | null) =>
    ['asambleas', condominioId, 'lista', estado] as const,
  detalle: (condominioId: number | null, id: number | null) =>
    ['asambleas', condominioId, 'detalle', id] as const,
  padron: (condominioId: number | null) => ['asambleas', condominioId, 'padron'] as const,
  anticipacion: (condominioId: number | null, fechaHora: string) =>
    ['asambleas', condominioId, 'anticipacion', fechaHora] as const,
  configuracion: (condominioId: number | null) =>
    ['asambleas', condominioId, 'configuracion'] as const,
};

export function useAsambleas(estado: Ref<EstadoAsamblea | null>) {
  const session = useSessionStore();

  return useQuery<AsambleaResumen[], ApiError>({
    queryKey: computed(() => clavesAsambleas.lista(session.condominioId, estado.value)),
    queryFn: () => asambleasService.lista(estado.value ?? undefined),
    enabled: computed(() => session.condominioId !== null),
    refetchOnWindowFocus: true,
  });
}

export function useAsamblea(id: Ref<number | null>) {
  const session = useSessionStore();

  return useQuery<AsambleaDetalle, ApiError>({
    queryKey: computed(() => clavesAsambleas.detalle(session.condominioId, id.value)),
    queryFn: () => asambleasService.ver(id.value as number),
    enabled: computed(() => session.condominioId !== null && id.value !== null),
    // Trae enlaces temporales a los informes: no se reusan de la caché
    gcTime: 0,
  });
}

/** El padrón de hoy, para cuando la asamblea aún no existe (al crearla ya viene en su detalle). */
export function usePadron(habilitado: Ref<boolean>) {
  const session = useSessionStore();

  return useQuery<PadronAsamblea, ApiError>({
    queryKey: computed(() => clavesAsambleas.padron(session.condominioId)),
    queryFn: () => asambleasService.padron(),
    enabled: computed(() => session.condominioId !== null && habilitado.value),
    refetchOnWindowFocus: false,
  });
}

/** La anticipación de la convocatoria para una fecha (la calcula el servidor: feriados y días hábiles). */
export function useAnticipacion(fechaHora: Ref<string | null>) {
  const session = useSessionStore();

  return useQuery<AnticipacionConvocatoria, ApiError>({
    queryKey: computed(() =>
      clavesAsambleas.anticipacion(session.condominioId, fechaHora.value ?? ''),
    ),
    queryFn: () => asambleasService.anticipacion(fechaHora.value as string),
    enabled: computed(() => session.condominioId !== null && fechaHora.value !== null),
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });
}

export function useConfiguracionAsambleas() {
  const session = useSessionStore();

  return useQuery<ConfiguracionAsambleas, ApiError>({
    queryKey: computed(() => clavesAsambleas.configuracion(session.condominioId)),
    queryFn: () => asambleasService.configuracion(),
    enabled: computed(() => session.condominioId !== null),
    refetchOnWindowFocus: false,
  });
}

/**
 * Cada cambio del borrador devuelve el detalle nuevo: se guarda en la caché del condominio **de la petición** (no del que esté activo
 * cuando responde) y se vuelve a pedir la lista y el padrón, también en error.
 */
function useMutacion<TVariables>(ejecutar: (v: TVariables) => Promise<AsambleaDetalle>) {
  const session = useSessionStore();
  const queryClient = useQueryClient();

  return useMutation<AsambleaDetalle, ApiError, TVariables, { condominioId: number | null }>({
    mutationFn: ejecutar,
    onMutate: () => ({ condominioId: session.condominioId }),
    onSuccess: (detalle, _v, contexto) => {
      if (contexto?.condominioId != null) {
        queryClient.setQueryData(
          clavesAsambleas.detalle(contexto.condominioId, detalle.id),
          detalle,
        );
      }
    },
    onSettled: (_d, _e, _v, contexto) => {
      if (contexto?.condominioId != null) {
        return queryClient.invalidateQueries({
          queryKey: clavesAsambleas.todas(contexto.condominioId),
        });
      }
      return undefined;
    },
  });
}

export const useCrearAsamblea = () =>
  useMutacion<GuardarAsamblea>((d) => asambleasService.crear(d));

export const useActualizarAsamblea = () =>
  useMutacion<{ id: number; datos: GuardarAsamblea }>(({ id, datos }) =>
    asambleasService.actualizar(id, datos),
  );

export const useAgregarPunto = () =>
  useMutacion<{ id: number; datos: GuardarPunto }>(({ id, datos }) =>
    asambleasService.agregarPunto(id, datos),
  );

export const useEditarPunto = () =>
  useMutacion<{ id: number; puntoId: number; datos: GuardarPunto }>(({ id, puntoId, datos }) =>
    asambleasService.editarPunto(id, puntoId, datos),
  );

export const useQuitarPunto = () =>
  useMutacion<{ id: number; puntoId: number }>(({ id, puntoId }) =>
    asambleasService.quitarPunto(id, puntoId),
  );

export const useMoverPunto = () =>
  useMutacion<{ id: number; puntoId: number; direccion: 'sube' | 'baja' }>(
    ({ id, puntoId, direccion }) => asambleasService.moverPunto(id, puntoId, direccion),
  );

export const useAdjuntarInforme = () =>
  useMutacion<{ id: number; puntoId: number; archivo: File }>(({ id, puntoId, archivo }) =>
    asambleasService.adjuntarInforme(id, puntoId, archivo),
  );

export const useQuitarInforme = () =>
  useMutacion<{ id: number; puntoId: number }>(({ id, puntoId }) =>
    asambleasService.quitarInforme(id, puntoId),
  );

export function useDescartarAsamblea() {
  const session = useSessionStore();
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, number, { condominioId: number | null }>({
    mutationFn: (id) => asambleasService.descartar(id),
    onMutate: () => ({ condominioId: session.condominioId }),
    onSettled: (_d, _e, _v, contexto) => {
      if (contexto?.condominioId != null) {
        return queryClient.invalidateQueries({
          queryKey: clavesAsambleas.todas(contexto.condominioId),
        });
      }
      return undefined;
    },
  });
}

export function useGuardarConfiguracionAsambleas() {
  const session = useSessionStore();
  const queryClient = useQueryClient();

  return useMutation<
    ConfiguracionAsambleas,
    ApiError,
    ConfiguracionAsambleas,
    { condominioId: number | null }
  >({
    mutationFn: (d) => asambleasService.guardarConfiguracion(d),
    onMutate: () => ({ condominioId: session.condominioId }),
    onSettled: (_d, _e, _v, contexto) => {
      if (contexto?.condominioId != null) {
        return queryClient.invalidateQueries({
          queryKey: clavesAsambleas.todas(contexto.condominioId),
        });
      }
      return undefined;
    },
  });
}
