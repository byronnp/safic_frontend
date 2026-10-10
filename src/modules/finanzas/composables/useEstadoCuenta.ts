import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import {
  estadoCuentaService,
  type EstadoCuenta,
  type PagoEfectivoRegistrado,
  type RangoCuenta,
} from '../services/estado-cuenta.service';
import { clavesFinanzas } from './usePeriodos';

/** Claves de caché: siempre incluyen el condominio activo. */
export const clavesEstadoCuenta = {
  unidad: (condominioId: number | null, unidadId: number, rango: RangoCuenta) =>
    [
      'finanzas',
      condominioId,
      'estado-cuenta',
      unidadId,
      rango.desde ?? '',
      rango.hasta ?? '',
    ] as const,
};

export function useEstadoCuenta(
  unidadId: Ref<number>,
  rango: Ref<RangoCuenta>,
  activo: Ref<boolean>,
) {
  const session = useSessionStore();

  return useQuery<EstadoCuenta, ApiError>({
    queryKey: computed(() =>
      clavesEstadoCuenta.unidad(session.condominioId, unidadId.value, rango.value),
    ),
    queryFn: () => estadoCuentaService.ver(unidadId.value, rango.value),
    enabled: computed(() => session.condominioId !== null && unidadId.value > 0 && activo.value),
    refetchOnWindowFocus: false,
  });
}

export function useRegistrarEfectivo() {
  const session = useSessionStore();
  const queryClient = useQueryClient();

  return useMutation<
    PagoEfectivoRegistrado,
    ApiError,
    { unidadId: number; monto: string },
    { condominioId: number | null }
  >({
    mutationFn: ({ unidadId, monto }) => estadoCuentaService.registrarEfectivo(unidadId, monto),
    onMutate: () => ({ condominioId: session.condominioId }),
    // También en error: el pago pudo guardarse aunque la respuesta falle
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
