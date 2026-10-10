import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import {
  pagosService,
  type EstadoRevision,
  type ListaPagos,
  type PagoDetalle,
  type RespuestaLote,
} from '../services/pagos.service';
import { clavesFinanzas } from './usePeriodos';

/** Claves de caché: siempre incluyen el condominio activo (cuelgan de `['finanzas', condominio]`). */
export const clavesPagos = {
  lista: (condominioId: number | null, estado: EstadoRevision) =>
    ['finanzas', condominioId, 'pagos', estado] as const,
  detalle: (condominioId: number | null, id: number) =>
    ['finanzas', condominioId, 'pago', id] as const,
};

export function usePagos(estado: Ref<EstadoRevision>) {
  const session = useSessionStore();

  return useQuery<ListaPagos, ApiError>({
    queryKey: computed(() => clavesPagos.lista(session.condominioId, estado.value)),
    queryFn: () => pagosService.listar(estado.value),
    enabled: computed(() => session.condominioId !== null),
    refetchOnWindowFocus: false,
  });
}

/** `id` null = ninguno elegido. El enlace del comprobante dura 10 minutos: no se reutiliza de la caché. */
export function usePago(id: Ref<number | null>) {
  const session = useSessionStore();

  return useQuery<PagoDetalle, ApiError>({
    queryKey: computed(() => clavesPagos.detalle(session.condominioId, id.value ?? 0)),
    queryFn: () => pagosService.ver(id.value as number),
    enabled: computed(() => session.condominioId !== null && id.value !== null),
    refetchOnWindowFocus: false,
    staleTime: 0,
    gcTime: 60_000,
  });
}

/** Toda decisión cambia las listas, los conteos y el resumen: se vuelve a pedir lo del condominio de la petición. */
function useMutacionPagos<TDatos, TVariables>(
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
          queryKey: clavesFinanzas.todas(contexto.condominioId),
        });
      }
      return undefined;
    },
  });
}

export function useAprobarPago() {
  return useMutacionPagos<PagoDetalle, { id: number; montoRecibido?: string }>(
    ({ id, montoRecibido }) => pagosService.aprobar(id, montoRecibido),
  );
}

export function useRechazarPago() {
  return useMutacionPagos<PagoDetalle, { id: number; motivo: string }>(({ id, motivo }) =>
    pagosService.rechazar(id, motivo),
  );
}

export function useAprobarLote() {
  return useMutacionPagos<RespuestaLote, number[]>((ids) => pagosService.aprobarLote(ids));
}
