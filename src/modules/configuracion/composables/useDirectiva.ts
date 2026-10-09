import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import {
  directivaService,
  type AsignarCargo,
  type CandidatoDirectiva,
  type CargoClave,
  type CargoDirectiva,
} from '../services/directiva.service';

/** Claves de caché: siempre incluyen el condominio activo. */
export const clavesDirectiva = {
  todas: (condominioId: number | null) => ['directiva', condominioId] as const,
  candidatos: (condominioId: number | null, cargo: CargoClave) =>
    ['directiva', condominioId, 'candidatos', cargo] as const,
};

export function useDirectiva() {
  const session = useSessionStore();

  return useQuery<CargoDirectiva[], ApiError>({
    queryKey: computed(() => clavesDirectiva.todas(session.condominioId)),
    queryFn: () => directivaService.ver(),
    enabled: computed(() => session.condominioId !== null),
    refetchOnWindowFocus: false,
  });
}

/** Quién puede ocupar el cargo elegido; no consulta mientras no haya cargo. */
export function useCandidatosDirectiva(cargo: Ref<CargoClave | null>) {
  const session = useSessionStore();

  return useQuery<CandidatoDirectiva[], ApiError>({
    queryKey: computed(() =>
      clavesDirectiva.candidatos(session.condominioId, cargo.value ?? 'presidente'),
    ),
    queryFn: () => directivaService.candidatos(cargo.value!),
    enabled: computed(() => session.condominioId !== null && cargo.value !== null),
    refetchOnWindowFocus: false,
    // Datos de personas del condominio: no se reutilizan entre aperturas del panel
    gcTime: 0,
  });
}

/**
 * Nombrar o cambiar al titular. Cambia la directiva y también el equipo (perfiles y cupo),
 * por eso se vuelven a pedir ambas listas del condominio desde donde se envió.
 */
export function useAsignarCargo() {
  const session = useSessionStore();
  const queryClient = useQueryClient();

  return useMutation<
    CargoDirectiva,
    ApiError,
    { cargo: CargoClave; datos: AsignarCargo },
    { condominioId: number | null }
  >({
    mutationFn: ({ cargo, datos }) => directivaService.asignar(cargo, datos),
    onMutate: () => ({ condominioId: session.condominioId }),
    onSettled: (_cargo, _error, _variables, contexto) => {
      if (contexto?.condominioId != null) {
        void queryClient.invalidateQueries({
          queryKey: clavesDirectiva.todas(contexto.condominioId),
        });
        void queryClient.invalidateQueries({ queryKey: ['usuarios', contexto.condominioId] });
      }
    },
  });
}
