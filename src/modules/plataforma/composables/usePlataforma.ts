import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';

import type { ApiError } from '@/core/api/errors';

import {
  plataformaService,
  type AdministradorCondominio,
  type AmenidadCatalogo,
  type CondominioCreado,
  type CondominioPlataforma,
  type EdicionCondominio,
  type NuevoCondominio,
  type PaginaCondominios,
  type Plan,
  type UsuarioEncontrado,
} from '../services/plataforma.service';

/**
 * Datos del panel de plataforma. No dependen de un condominio, así que sus claves
 * empiezan por 'plataforma' (no por condominioId); la caché se vacía al cerrar sesión.
 */
export const clavesPlataforma = {
  planes: ['plataforma', 'planes'] as const,
  amenidades: ['plataforma', 'amenidades'] as const,
  condominios: ['plataforma', 'condominios'] as const,
  listaCondominios: (buscar: string, pagina: number) =>
    ['plataforma', 'condominios', { buscar, pagina }] as const,
  usuario: (email: string) => ['plataforma', 'usuario', email] as const,
};

export function usePlanes() {
  return useQuery<Plan[], ApiError>({
    queryKey: clavesPlataforma.planes,
    queryFn: () => plataformaService.planes(),
    staleTime: 5 * 60_000,
  });
}

export function useCatalogoAmenidades() {
  return useQuery<AmenidadCatalogo[], ApiError>({
    queryKey: clavesPlataforma.amenidades,
    queryFn: () => plataformaService.amenidades(),
    staleTime: 5 * 60_000,
  });
}

export function useCondominiosPlataforma(buscar: Ref<string>, pagina: Ref<number>) {
  return useQuery<PaginaCondominios, ApiError>({
    queryKey: computed(() => clavesPlataforma.listaCondominios(buscar.value.trim(), pagina.value)),
    queryFn: () =>
      plataformaService.condominios({ buscar: buscar.value.trim(), pagina: pagina.value }),
    placeholderData: (anterior) => anterior,
  });
}

export function useCrearCondominio() {
  const queryClient = useQueryClient();

  return useMutation<CondominioCreado, ApiError, NuevoCondominio>({
    mutationFn: (datos) => plataformaService.crear(datos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clavesPlataforma.condominios }),
  });
}

/** Busca al administrador por correo (solo con un correo bien escrito). */
export function useBuscarUsuario(email: Ref<string>) {
  const normalizado = computed(() => email.value.trim().toLowerCase());

  return useQuery<UsuarioEncontrado | null, ApiError>({
    queryKey: computed(() => clavesPlataforma.usuario(normalizado.value)),
    queryFn: () => plataformaService.buscarUsuario(normalizado.value),
    enabled: computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizado.value)),
    staleTime: 60_000,
  });
}

export function useReenviarInvitacion() {
  const queryClient = useQueryClient();

  return useMutation<
    AdministradorCondominio,
    ApiError,
    { condominioId: number; usuarioId: number; email: string | null }
  >({
    mutationFn: ({ condominioId, usuarioId, email }) =>
      plataformaService.reenviarInvitacion(condominioId, usuarioId, email),
    // La tarjeta muestra el correo del administrador
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clavesPlataforma.condominios }),
  });
}

/** Editar o cambiar el estado cambia las tarjetas: se vuelve a pedir la lista, también en error. */
function useMutacionCondominio<TVariables>(
  ejecutar: (variables: TVariables) => Promise<CondominioPlataforma>,
) {
  const queryClient = useQueryClient();

  return useMutation<CondominioPlataforma, ApiError, TVariables>({
    mutationFn: ejecutar,
    onSettled: () => queryClient.invalidateQueries({ queryKey: clavesPlataforma.condominios }),
  });
}

export function useEditarCondominio() {
  return useMutacionCondominio<{ id: number; cambios: EdicionCondominio }>(({ id, cambios }) =>
    plataformaService.editar(id, cambios),
  );
}

export function useInactivarCondominio() {
  return useMutacionCondominio<{ id: number; motivo: string }>(({ id, motivo }) =>
    plataformaService.inactivar(id, motivo),
  );
}

export function useReactivarCondominio() {
  return useMutacionCondominio<{ id: number; motivo: string }>(({ id, motivo }) =>
    plataformaService.reactivar(id, motivo),
  );
}
