import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import {
  conciliacionService,
  type Conciliacion,
  type EstadoCuentaBanco,
  type ImportarEstado,
  type ResultadoImportacion,
  type TipoManual,
} from '../services/conciliacion.service';
import { clavesFinanzas } from './usePeriodos';

/** Claves de caché: siempre incluyen el condominio activo (cuelgan de `['finanzas', condominio]`). */
export const clavesConciliacion = {
  estados: (condominioId: number | null, periodo: string) =>
    ['finanzas', condominioId, 'conciliacion', 'estados', periodo] as const,
  detalle: (condominioId: number | null, id: number) =>
    ['finanzas', condominioId, 'conciliacion', 'detalle', id] as const,
};

export function useEstadosCuenta(periodo: Ref<string>) {
  const session = useSessionStore();

  return useQuery<EstadoCuentaBanco[], ApiError>({
    queryKey: computed(() => clavesConciliacion.estados(session.condominioId, periodo.value)),
    queryFn: () => conciliacionService.estados(periodo.value),
    enabled: computed(() => session.condominioId !== null && periodo.value !== ''),
    refetchOnWindowFocus: false,
  });
}

export function useConciliacion(id: Ref<number | null>) {
  const session = useSessionStore();

  return useQuery<Conciliacion, ApiError>({
    queryKey: computed(() => clavesConciliacion.detalle(session.condominioId, id.value ?? 0)),
    queryFn: () => conciliacionService.ver(id.value ?? 0),
    enabled: computed(() => session.condominioId !== null && id.value !== null),
    refetchOnWindowFocus: false,
  });
}

/** Toda acción cambia la conciliación y el cierre de mes: se vuelve a pedir lo de finanzas, también en error. */
function useMutacionConciliacion<TDatos, TVariables>(
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

export function useImportarEstado() {
  return useMutacionConciliacion<ResultadoImportacion, ImportarEstado>((d) =>
    conciliacionService.importar(d),
  );
}

export function useVincularLinea() {
  return useMutacionConciliacion<
    Conciliacion,
    { id: number; tipo: 'pago_residente' | 'pago_proveedor'; pagoId: number }
  >(({ id, tipo, pagoId }) => conciliacionService.vincular(id, tipo, pagoId));
}

export function useClasificarLinea() {
  return useMutacionConciliacion<
    Conciliacion,
    { id: number; tipo: TipoManual; guardarRegla: boolean }
  >(({ id, tipo, guardarRegla }) => conciliacionService.clasificar(id, tipo, guardarRegla));
}

export function useDeshacerLinea() {
  return useMutacionConciliacion<Conciliacion, number>((id) => conciliacionService.deshacer(id));
}

export function useAjustarConciliacion() {
  return useMutacionConciliacion<Conciliacion, { estadoId: number; monto: string; motivo: string }>(
    ({ estadoId, monto, motivo }) => conciliacionService.ajustar(estadoId, monto, motivo),
  );
}
