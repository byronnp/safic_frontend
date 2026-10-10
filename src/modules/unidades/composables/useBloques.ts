import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import { clavesUnidades } from './useUnidades';

import {
  bloquesService,
  type Bloque,
  type CambiosBloque,
  type NuevoBloque,
} from '../services/bloques.service';

/** Clave de caché: siempre incluye el condominio activo. */
export const clavesBloques = {
  todos: (condominioId: number | null) => ['bloques', condominioId] as const,
};

export function useBloques() {
  const session = useSessionStore();
  const clave = computed(() => clavesBloques.todos(session.condominioId));

  return useQuery<Bloque[], ApiError>({
    queryKey: clave,
    queryFn: () => bloquesService.listar(),
    enabled: computed(() => session.condominioId !== null),
  });
}

export function useCrearBloque() {
  const session = useSessionStore();
  const queryClient = useQueryClient();

  return useMutation<Bloque, ApiError, NuevoBloque>({
    mutationFn: (datos) => bloquesService.crear(datos),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: clavesBloques.todos(session.condominioId) }),
  });
}

/**
 * Cambia la lista de bloques y los datos de las unidades (que muestran su bloque): se vuelve a pedir
 * desde el condominio donde se envió, también en error para no dejar la lista desactualizada.
 */
function useMutacionBloques<TDatos, TVariables>(
  ejecutar: (variables: TVariables) => Promise<TDatos>,
) {
  const session = useSessionStore();
  const queryClient = useQueryClient();

  return useMutation<TDatos, ApiError, TVariables, { condominioId: number | null }>({
    mutationFn: ejecutar,
    onMutate: () => ({ condominioId: session.condominioId }),
    onSettled: (_datos, _error, _variables, contexto) => {
      if (contexto?.condominioId != null) {
        return Promise.all([
          queryClient.invalidateQueries({ queryKey: clavesBloques.todos(contexto.condominioId) }),
          queryClient.invalidateQueries({ queryKey: clavesUnidades.todas(contexto.condominioId) }),
        ]);
      }
      return undefined;
    },
  });
}

export function useEditarBloque() {
  return useMutacionBloques<Bloque, { id: number; cambios: CambiosBloque }>(({ id, cambios }) =>
    bloquesService.editar(id, cambios),
  );
}

export function useEliminarBloque() {
  return useMutacionBloques<void, number>((id) => bloquesService.eliminar(id));
}
