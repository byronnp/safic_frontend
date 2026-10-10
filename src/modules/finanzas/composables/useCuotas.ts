import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import {
  cuotasService,
  type CuotaExtraordinariaCreada,
  type FiltroListaCuotas,
  type ListaCuotas,
  type NuevaCuotaExtraordinaria,
} from '../services/cuotas.service';
import { clavesFinanzas } from './usePeriodos';

/** Claves de caché: siempre incluyen el condominio activo (cuelgan de `['finanzas', condominio]`). */
export const clavesCuotas = {
  lista: (condominioId: number | null, f: FiltroListaCuotas) =>
    [
      'finanzas',
      condominioId,
      'cuotas',
      f.periodo ?? 'en-curso',
      f.filtro,
      f.buscar.trim(),
      f.pagina,
    ] as const,
};

export function useCuotasDelMes(filtro: Ref<FiltroListaCuotas>) {
  const session = useSessionStore();

  return useQuery<ListaCuotas, ApiError>({
    queryKey: computed(() => clavesCuotas.lista(session.condominioId, filtro.value)),
    queryFn: () => cuotasService.listar(filtro.value),
    enabled: computed(() => session.condominioId !== null),
    refetchOnWindowFocus: false,
    placeholderData: (anterior) => anterior,
  });
}

export function useCrearCuotaExtraordinaria() {
  const session = useSessionStore();
  const queryClient = useQueryClient();

  return useMutation<
    CuotaExtraordinariaCreada,
    ApiError,
    NuevaCuotaExtraordinaria,
    { condominioId: number | null }
  >({
    mutationFn: (datos) => cuotasService.crearExtraordinaria(datos),
    onMutate: () => ({ condominioId: session.condominioId }),
    // Cambia las cuotas, el resumen y las cuentas de las unidades: se vuelve a pedir todo lo de finanzas
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
