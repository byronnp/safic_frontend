import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import { bloquesService, type Bloque, type NuevoBloque } from '../services/bloques.service';

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
