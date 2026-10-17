import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import {
  reportesService,
  type ClaveReporte,
  type Exportacion,
  type Reporte,
} from '../services/reportes.service';

/** Claves de caché: siempre incluyen el condominio activo (cuelgan de `['finanzas', condominio]`). */
export const clavesReportes = {
  reporte: (condominioId: number | null, reporte: ClaveReporte, periodo: string) =>
    ['finanzas', condominioId, 'reporte', reporte, periodo] as const,
  exportaciones: (condominioId: number | null) =>
    ['finanzas', condominioId, 'exportaciones'] as const,
};

/** Un reporte en pantalla; solo se pide cuando se abre (`reporte` no es null). */
export function useReporte(reporte: Ref<ClaveReporte | null>, periodo: Ref<string>) {
  const session = useSessionStore();

  return useQuery<Reporte, ApiError>({
    queryKey: computed(() =>
      clavesReportes.reporte(
        session.condominioId,
        reporte.value ?? 'ingresos_gastos',
        periodo.value,
      ),
    ),
    queryFn: () => reportesService.ver(reporte.value ?? 'ingresos_gastos', periodo.value),
    enabled: computed(
      () => session.condominioId !== null && reporte.value !== null && periodo.value !== '',
    ),
    refetchOnWindowFocus: false,
    // Los datos del reporte no se guardan en memoria al cerrar la vista
    gcTime: 0,
  });
}

export function useExportaciones() {
  const session = useSessionStore();

  return useQuery<Exportacion[], ApiError>({
    queryKey: computed(() => clavesReportes.exportaciones(session.condominioId)),
    queryFn: () => reportesService.exportaciones(),
    enabled: computed(() => session.condominioId !== null),
    refetchOnWindowFocus: false,
  });
}

export function useExportarExcel() {
  const session = useSessionStore();
  const queryClient = useQueryClient();

  return useMutation<
    Blob,
    ApiError,
    { reporte: ClaveReporte; periodo: string },
    { condominioId: number | null }
  >({
    mutationFn: ({ reporte, periodo }) => reportesService.excel(reporte, periodo),
    onMutate: () => ({ condominioId: session.condominioId }),
    // También en error: el archivo pudo registrarse (y el límite diario cuenta)
    onSettled: (_datos, _error, _variables, contexto) => {
      if (contexto?.condominioId != null) {
        return queryClient.invalidateQueries({
          queryKey: clavesReportes.exportaciones(contexto.condominioId),
        });
      }
      return undefined;
    },
  });
}
