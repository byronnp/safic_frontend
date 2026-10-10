import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import {
  miCuentaService,
  type EnviarPago,
  type MiCuenta,
  type PagoEnviado,
} from '../services/mi-cuenta.service';

/** Clave de caché: siempre incluye el condominio activo. */
export const clavesMiCuenta = {
  todas: (condominioId: number | null) => ['mi-cuenta', condominioId] as const,
};

export function useMiCuenta() {
  const session = useSessionStore();

  return useQuery<MiCuenta, ApiError>({
    queryKey: computed(() => clavesMiCuenta.todas(session.condominioId)),
    queryFn: () => miCuentaService.ver(),
    enabled: computed(() => session.condominioId !== null),
    refetchOnWindowFocus: false,
  });
}

export function usePagarMiCuenta() {
  const session = useSessionStore();
  const queryClient = useQueryClient();

  return useMutation<PagoEnviado, ApiError, EnviarPago, { condominioId: number | null }>({
    mutationFn: (datos) => miCuentaService.pagar(datos),
    // El condominio de la petición, no el de cuando responde
    onMutate: () => ({ condominioId: session.condominioId }),
    // También en error: un 409 (cuotas ya en revisión) deja la lista desactualizada
    onSettled: (_datos, _error, _variables, contexto) => {
      if (contexto?.condominioId != null) {
        return queryClient.invalidateQueries({
          queryKey: clavesMiCuenta.todas(contexto.condominioId),
        });
      }
      return undefined;
    },
  });
}
