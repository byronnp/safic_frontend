import { useMutation, useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import { rolesService, type RolesCondominio, type SolicitarRol } from '../services/roles.service';

/** Clave de caché: siempre incluye el condominio activo. */
export const clavesRoles = {
  todos: (condominioId: number | null) => ['roles', condominioId] as const,
};

export function useRoles() {
  const session = useSessionStore();

  return useQuery<RolesCondominio, ApiError>({
    queryKey: computed(() => clavesRoles.todos(session.condominioId)),
    queryFn: () => rolesService.listar(),
    enabled: computed(() => session.condominioId !== null),
    refetchOnWindowFocus: false,
  });
}

/** Pedir un rol nuevo a la plataforma: no cambia ninguna lista del condominio. */
export function useSolicitarRol() {
  return useMutation<{ id: number; nombre: string; estado: string }, ApiError, SolicitarRol>({
    mutationFn: (datos) => rolesService.solicitar(datos),
  });
}
