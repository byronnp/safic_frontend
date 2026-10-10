import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import {
  cuentasBancariasService,
  type CambiosCuentaBancaria,
  type CuentaBancaria,
  type NuevaCuentaBancaria,
} from '../services/cuentas-bancarias.service';

/** Clave de caché: siempre incluye el condominio activo. */
export const clavesCuentasBancarias = {
  todas: (condominioId: number | null) => ['cuentas-bancarias', condominioId] as const,
};

export function useCuentasBancarias() {
  const session = useSessionStore();

  return useQuery<CuentaBancaria[], ApiError>({
    queryKey: computed(() => clavesCuentasBancarias.todas(session.condominioId)),
    queryFn: () => cuentasBancariasService.listar(),
    enabled: computed(() => session.condominioId !== null),
    refetchOnWindowFocus: false,
  });
}

/** Toda mutación cambia la lista (la principal se mueve): se vuelve a pedir, también en error. */
function useMutacionCuentas<TVariables>(
  ejecutar: (variables: TVariables) => Promise<CuentaBancaria>,
) {
  const session = useSessionStore();
  const queryClient = useQueryClient();

  return useMutation<CuentaBancaria, ApiError, TVariables, { condominioId: number | null }>({
    mutationFn: ejecutar,
    onMutate: () => ({ condominioId: session.condominioId }),
    onSettled: (_datos, _error, _variables, contexto) => {
      if (contexto?.condominioId != null) {
        return queryClient.invalidateQueries({
          queryKey: clavesCuentasBancarias.todas(contexto.condominioId),
        });
      }
      return undefined;
    },
  });
}

export function useCrearCuentaBancaria() {
  return useMutacionCuentas<NuevaCuentaBancaria>((datos) => cuentasBancariasService.crear(datos));
}

export function useEditarCuentaBancaria() {
  return useMutacionCuentas<{ id: number; cambios: CambiosCuentaBancaria }>(({ id, cambios }) =>
    cuentasBancariasService.editar(id, cambios),
  );
}
