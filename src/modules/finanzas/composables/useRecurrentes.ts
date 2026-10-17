import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import {
  recurrentesService,
  type CambiosRecurrente,
  type FacturaCandidata,
  type GastoRecurrente,
  type ListaRecurrentes,
  type NuevoRecurrente,
} from '../services/recurrentes.service';
import { clavesFinanzas } from './usePeriodos';

/** Claves de caché: siempre incluyen el condominio activo (cuelgan de `['finanzas', condominio]`). */
export const clavesRecurrentes = {
  lista: (condominioId: number | null, periodo: string) =>
    ['finanzas', condominioId, 'recurrentes', periodo] as const,
  facturas: (condominioId: number | null, id: number) =>
    ['finanzas', condominioId, 'recurrentes-facturas', id] as const,
};

export function useRecurrentes(periodo: Ref<string>) {
  const session = useSessionStore();

  return useQuery<ListaRecurrentes, ApiError>({
    queryKey: computed(() => clavesRecurrentes.lista(session.condominioId, periodo.value)),
    queryFn: () => recurrentesService.listar(periodo.value),
    enabled: computed(() => session.condominioId !== null && periodo.value !== ''),
    refetchOnWindowFocus: false,
  });
}

export function useFacturasCandidatas(id: Ref<number | null>) {
  const session = useSessionStore();

  return useQuery<FacturaCandidata[], ApiError>({
    queryKey: computed(() => clavesRecurrentes.facturas(session.condominioId, id.value ?? 0)),
    queryFn: () => recurrentesService.facturas(id.value ?? 0),
    enabled: computed(() => session.condominioId !== null && id.value !== null),
    refetchOnWindowFocus: false,
    gcTime: 0,
  });
}

/** Cada cambio mueve la lista y las cuentas por pagar: se vuelve a pedir lo de finanzas, también en error. */
function useMutacionRecurrentes<TDatos, TVariables>(
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

export function useCrearRecurrente() {
  return useMutacionRecurrentes<GastoRecurrente, NuevoRecurrente>((d) =>
    recurrentesService.crear(d),
  );
}

export function useEditarRecurrente() {
  return useMutacionRecurrentes<GastoRecurrente, { id: number; cambios: CambiosRecurrente }>(
    ({ id, cambios }) => recurrentesService.editar(id, cambios),
  );
}

export function useVincularFactura() {
  return useMutacionRecurrentes<
    { aprobadaAutomaticamente: boolean },
    { id: number; periodo: string; gastoId: number }
  >(({ id, periodo, gastoId }) => recurrentesService.vincular(id, periodo, gastoId));
}
