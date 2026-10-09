import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';

import type { ApiError } from '@/core/api/errors';

import { rolesAdminService, type RolAdmin, type RolesAdmin } from '../services/roles-admin.service';

/** Datos del panel de plataforma: no dependen de un condominio (`['plataforma', …]`). */
export const clavesRolesAdmin = {
  todas: ['plataforma', 'roles'] as const,
  matriz: ['plataforma', 'roles', 'matriz'] as const,
  /** Para `useIsMutating`: cualquier cambio de roles en curso. */
  mutacion: ['plataforma', 'roles', 'cambio'] as const,
};

export function useRolesAdmin() {
  return useQuery<RolesAdmin, ApiError>({
    queryKey: clavesRolesAdmin.matriz,
    queryFn: () => rolesAdminService.listar(),
    refetchOnWindowFocus: false,
  });
}

/** Todo cambio altera la matriz: se vuelve a pedir (también en error). */
function useMutacionRoles<TVariables>(ejecutar: (variables: TVariables) => Promise<RolAdmin>) {
  const queryClient = useQueryClient();

  return useMutation<RolAdmin, ApiError, TVariables>({
    mutationKey: clavesRolesAdmin.mutacion,
    mutationFn: ejecutar,
    onSettled: () => queryClient.invalidateQueries({ queryKey: clavesRolesAdmin.todas }),
  });
}

export function useCrearRol() {
  return useMutacionRoles<string>((nombre) => rolesAdminService.crear(nombre));
}

export function useGuardarPermisosRol() {
  return useMutacionRoles<{ clave: string; permisos: string[] }>(({ clave, permisos }) =>
    rolesAdminService.guardarPermisos(clave, permisos),
  );
}
