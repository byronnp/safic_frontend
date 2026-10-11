import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import { cierreMesService, type CierreMes } from '../services/cierre-mes.service';
import { clavesFinanzas } from './usePeriodos';

/** Claves de caché: siempre incluyen el condominio activo. */
export const clavesCierre = {
  mes: (condominioId: number | null, periodo: string) =>
    ['finanzas', condominioId, 'cierre', periodo] as const,
};

export function useCierreMes(periodo: Ref<string>) {
  const session = useSessionStore();

  return useQuery<CierreMes, ApiError>({
    queryKey: computed(() => clavesCierre.mes(session.condominioId, periodo.value)),
    queryFn: () => cierreMesService.ver(periodo.value),
    enabled: computed(() => session.condominioId !== null && periodo.value !== ''),
    refetchOnWindowFocus: false,
  });
}

/** Cerrar o reabrir cambia el estado del mes en todas las pantallas de finanzas. */
function useMutacionCierre<TVariables>(ejecutar: (variables: TVariables) => Promise<CierreMes>) {
  const session = useSessionStore();
  const queryClient = useQueryClient();

  return useMutation<CierreMes, ApiError, TVariables, { condominioId: number | null }>({
    mutationFn: ejecutar,
    onMutate: () => ({ condominioId: session.condominioId }),
    // También en error: el cambio pudo guardarse aunque la respuesta falle
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

export function useCerrarMes() {
  return useMutacionCierre<string>((periodo) => cierreMesService.cerrar(periodo));
}

export function useReabrirMes() {
  return useMutacionCierre<{ periodo: string; motivo: string }>(({ periodo, motivo }) =>
    cierreMesService.reabrir(periodo, motivo),
  );
}
