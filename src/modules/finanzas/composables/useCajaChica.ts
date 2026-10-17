import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import {
  cajaChicaService,
  type CajaChica,
  type ConfiguracionCajaChica,
  type NuevoMovimientoCajaChica,
} from '../services/caja-chica.service';
import { clavesFinanzas } from './usePeriodos';

/** Claves de caché: siempre incluyen el condominio activo (cuelgan de `['finanzas', condominio]`). */
export const clavesCajaChica = {
  estado: (condominioId: number | null) => ['finanzas', condominioId, 'caja-chica'] as const,
};

export function useCajaChica() {
  const session = useSessionStore();

  return useQuery<CajaChica, ApiError>({
    queryKey: computed(() => clavesCajaChica.estado(session.condominioId)),
    queryFn: () => cajaChicaService.ver(),
    enabled: computed(() => session.condominioId !== null),
    refetchOnWindowFocus: false,
    // Los enlaces a los respaldos caducan: no se reusan de la caché
    gcTime: 0,
  });
}

/** Cada cambio mueve la caja y las cuentas por pagar: se vuelve a pedir lo de finanzas, también en error. */
function useMutacionCajaChica<TDatos, TVariables>(
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

export function useGuardarCajaChica() {
  return useMutacionCajaChica<CajaChica, ConfiguracionCajaChica>((d) =>
    cajaChicaService.guardar(d),
  );
}

export function useRegistrarGastoCajaChica() {
  return useMutacionCajaChica<CajaChica, NuevoMovimientoCajaChica>((d) =>
    cajaChicaService.registrar(d),
  );
}

export function useReponerCajaChica() {
  return useMutacionCajaChica<{ gastoNumero: string }, void>(() => cajaChicaService.reponer());
}
