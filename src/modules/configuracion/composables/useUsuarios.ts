import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import {
  usuariosService,
  type ActualizarUsuario,
  type InvitarUsuario,
  type ListaUsuarios,
  type UsuarioCondominio,
  type UsuarioInvitado,
} from '../services/usuarios.service';

/** Clave de caché: siempre incluye el condominio activo. */
export const clavesUsuarios = {
  todos: (condominioId: number | null) => ['usuarios', condominioId] as const,
};

export function useUsuarios() {
  const session = useSessionStore();

  return useQuery<ListaUsuarios, ApiError>({
    queryKey: computed(() => clavesUsuarios.todos(session.condominioId)),
    queryFn: () => usuariosService.listar(),
    enabled: computed(() => session.condominioId !== null),
    // Un refresco al volver a la pestaña no debe cerrar lo que se está editando
    refetchOnWindowFocus: false,
  });
}

/**
 * Toda mutación cambia la lista y el cupo: se vuelve a pedir. Se usa el condominio de
 * cuando se envió, no el de cuando responde (por si la persona cambió de condominio).
 */
function useMutacionUsuarios<TDatos, TVariables>(
  ejecutar: (variables: TVariables) => Promise<TDatos>,
) {
  const session = useSessionStore();
  const queryClient = useQueryClient();

  return useMutation<TDatos, ApiError, TVariables, { condominioId: number | null }>({
    mutationFn: ejecutar,
    onMutate: () => ({ condominioId: session.condominioId }),
    // También en error: un 409 de cupo indica que la lista local quedó desactualizada
    onSettled: (_datos, _error, _variables, contexto) => {
      if (contexto?.condominioId != null) {
        void queryClient.invalidateQueries({
          queryKey: clavesUsuarios.todos(contexto.condominioId),
        });
      }
    },
  });
}

export function useInvitarUsuario() {
  return useMutacionUsuarios<UsuarioInvitado, InvitarUsuario>((datos) =>
    usuariosService.invitar(datos),
  );
}

export function useActualizarUsuario() {
  return useMutacionUsuarios<UsuarioCondominio, { id: number; datos: ActualizarUsuario }>(
    ({ id, datos }) => usuariosService.actualizar(id, datos),
  );
}

export function useReenviarInvitacion() {
  return useMutacionUsuarios<UsuarioCondominio, number>((id) =>
    usuariosService.reenviarInvitacion(id),
  );
}
