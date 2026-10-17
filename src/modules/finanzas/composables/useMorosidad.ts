import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import {
  morosidadService,
  type Convenio,
  type FiltroListaMorosidad,
  type ListaMorosidad,
  type ResultadoRecordatorios,
} from '../services/morosidad.service';
import { clavesFinanzas } from './usePeriodos';

/** Claves de caché: siempre incluyen el condominio activo (cuelgan de `['finanzas', condominio]`). */
export const clavesMorosidad = {
  lista: (condominioId: number | null, f: FiltroListaMorosidad) =>
    ['finanzas', condominioId, 'morosidad', f.filtro, f.buscar.trim(), f.pagina] as const,
  convenios: (condominioId: number | null, unidadId: number) =>
    ['finanzas', condominioId, 'convenios', unidadId] as const,
};

export function useMorosidad(filtro: Ref<FiltroListaMorosidad>) {
  const session = useSessionStore();

  return useQuery<ListaMorosidad, ApiError>({
    queryKey: computed(() => clavesMorosidad.lista(session.condominioId, filtro.value)),
    queryFn: () => morosidadService.listar(filtro.value),
    enabled: computed(() => session.condominioId !== null),
    refetchOnWindowFocus: false,
  });
}

export function useConvenios(unidadId: Ref<number | null>) {
  const session = useSessionStore();

  return useQuery<Convenio[], ApiError>({
    queryKey: computed(() => clavesMorosidad.convenios(session.condominioId, unidadId.value ?? 0)),
    queryFn: () => morosidadService.convenios(unidadId.value ?? 0),
    enabled: computed(() => session.condominioId !== null && unidadId.value !== null),
    refetchOnWindowFocus: false,
  });
}

/** Cada acción cambia la cartera, los convenios y el cierre de mes: se vuelve a pedir lo de finanzas, también en error. */
function useMutacionMorosidad<TDatos, TVariables>(
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

export function useRecordar() {
  return useMutacionMorosidad<ResultadoRecordatorios, number[] | null>((ids) =>
    morosidadService.recordar(ids),
  );
}

export function useLevantarRestriccion() {
  return useMutacionMorosidad<void, { unidadId: number; motivo: string }>(({ unidadId, motivo }) =>
    morosidadService.levantarRestriccion(unidadId, motivo),
  );
}

export function useCrearConvenio() {
  return useMutacionMorosidad<
    Convenio,
    { unidadId: number; cuotas: number; primeraCuotaEl: string }
  >(({ unidadId, cuotas, primeraCuotaEl }) =>
    morosidadService.crearConvenio(unidadId, cuotas, primeraCuotaEl),
  );
}

export function useCancelarConvenio() {
  return useMutacionMorosidad<Convenio, { id: number; motivo: string }>(({ id, motivo }) =>
    morosidadService.cancelarConvenio(id, motivo),
  );
}
