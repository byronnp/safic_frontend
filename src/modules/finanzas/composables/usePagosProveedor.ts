import { useMutation, useQueryClient } from '@tanstack/vue-query';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import {
  pagosProveedorService,
  type NuevoPagoProveedor,
  type PagoProveedor,
} from '../services/pagos-proveedor.service';
import { clavesFinanzas } from './usePeriodos';

export function useRegistrarPagoProveedor() {
  const session = useSessionStore();
  const queryClient = useQueryClient();

  return useMutation<PagoProveedor, ApiError, NuevoPagoProveedor, { condominioId: number | null }>({
    mutationFn: (datos) => pagosProveedorService.registrar(datos),
    onMutate: () => ({ condominioId: session.condominioId }),
    // También en error: el pago pudo guardarse aunque la respuesta falle. Cambian facturas y saldos.
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
