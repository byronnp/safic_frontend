import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import {
  gastosService,
  type FacturaManual,
  type FacturaXml,
  type FiltroGastos,
  type Gasto,
  type ListaGastos,
} from '../services/gastos.service';
import { clavesFinanzas } from './usePeriodos';

/** Claves de caché: siempre incluyen el condominio activo. */
export const clavesGastos = {
  lista: (condominioId: number | null, filtro: FiltroGastos, buscar: string) =>
    ['finanzas', condominioId, 'gastos', filtro, buscar.trim()] as const,
};

export function useGastos(filtro: Ref<FiltroGastos>, buscar: Ref<string>) {
  const session = useSessionStore();

  return useQuery<ListaGastos, ApiError>({
    queryKey: computed(() => clavesGastos.lista(session.condominioId, filtro.value, buscar.value)),
    queryFn: () => gastosService.listar(filtro.value, buscar.value),
    enabled: computed(() => session.condominioId !== null),
    refetchOnWindowFocus: false,
    placeholderData: (anterior) => anterior,
  });
}

function useMutacionGastos<TVariables>(ejecutar: (variables: TVariables) => Promise<Gasto>) {
  const session = useSessionStore();
  const queryClient = useQueryClient();

  return useMutation<Gasto, ApiError, TVariables, { condominioId: number | null }>({
    mutationFn: ejecutar,
    onMutate: () => ({ condominioId: session.condominioId }),
    // También en error: la factura pudo guardarse aunque la respuesta falle. Cambian también
    // los saldos de los proveedores, por eso se vuelve a pedir todo lo de finanzas.
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

export function useRegistrarFactura() {
  return useMutacionGastos<FacturaManual>((d) => gastosService.registrar(d));
}

export function useImportarFacturaXml() {
  return useMutacionGastos<FacturaXml>((d) => gastosService.importarXml(d));
}
