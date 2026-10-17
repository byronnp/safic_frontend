import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import {
  garitaService,
  type BitacoraGarita,
  type FiltrosBitacora,
  type IngresoSinQr,
  type PanelGarita,
  type ValidacionQr,
} from '../services/garita.service';

/** Claves de caché: siempre incluyen el condominio activo. */
export const clavesGarita = {
  todas: (condominioId: number | null) => ['garita', condominioId] as const,
  panel: (condominioId: number | null) => ['garita', condominioId, 'panel'] as const,
  bitacora: (condominioId: number | null, f: FiltrosBitacora) =>
    ['garita', condominioId, 'bitacora', f.desde, f.hasta, f.tipo, f.q] as const,
};

export function usePanelGarita() {
  const session = useSessionStore();

  return useQuery<PanelGarita, ApiError>({
    queryKey: computed(() => clavesGarita.panel(session.condominioId)),
    queryFn: () => garitaService.panel(),
    enabled: computed(() => session.condominioId !== null),
    // La garita queda abierta todo el turno: se refresca sola
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    gcTime: 0,
  });
}

export function useBitacoraGarita(filtros: Ref<FiltrosBitacora>) {
  const session = useSessionStore();

  return useQuery<BitacoraGarita, ApiError>({
    queryKey: computed(() => clavesGarita.bitacora(session.condominioId, filtros.value)),
    queryFn: () => garitaService.bitacora(filtros.value),
    enabled: computed(() => session.condominioId !== null),
    refetchOnWindowFocus: true,
    // Trae nombres de visitantes: no se deja en caché
    gcTime: 0,
  });
}

/** Cada cambio mueve el panel y la bitácora: se vuelve a pedir lo del condominio, también en error. */
function useMutacionGarita<TDatos, TVariables>(
  ejecutar: (variables: TVariables) => Promise<TDatos>,
) {
  const session = useSessionStore();
  const queryClient = useQueryClient();

  return useMutation<TDatos, ApiError, TVariables, { condominioId: number | null }>({
    mutationFn: ejecutar,
    onMutate: () => ({ condominioId: session.condominioId }),
    onSettled: (_datos, _error, _variables, contexto) => {
      if (contexto?.condominioId != null) {
        return Promise.all([
          queryClient.invalidateQueries({ queryKey: clavesGarita.todas(contexto.condominioId) }),
          // Lo que ve el residente en «Ingresos a tu unidad»
          queryClient.invalidateQueries({ queryKey: ['visitas', contexto.condominioId] }),
        ]);
      }
      return undefined;
    },
  });
}

/** Solo consulta (no cambia nada): sin invalidar. */
export function useValidarQr() {
  return useMutation<ValidacionQr, ApiError, string>({
    mutationFn: (token) => garitaService.validarQr(token),
  });
}

export function useIngresoConQr() {
  return useMutacionGarita<void, string>((token) => garitaService.ingresoConQr(token));
}

export function useIngresoSinQr() {
  return useMutacionGarita<void, IngresoSinQr>((d) => garitaService.ingresoSinQr(d));
}

export function useRegistrarSalida() {
  return useMutacionGarita<void, number>((id) => garitaService.salida(id));
}
