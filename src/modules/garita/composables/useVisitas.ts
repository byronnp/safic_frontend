import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import {
  visitasService,
  type MisVisitas,
  type NuevaVisita,
  type VisitaAutorizada,
  type VisitaPublica,
} from '../services/visitas.service';

/** Claves de caché: siempre incluyen el condominio activo. */
export const clavesVisitas = {
  todas: (condominioId: number | null) => ['visitas', condominioId] as const,
  mias: (condominioId: number | null) => ['visitas', condominioId, 'mias'] as const,
};

export function useMisVisitas() {
  const session = useSessionStore();

  return useQuery<MisVisitas, ApiError>({
    queryKey: computed(() => clavesVisitas.mias(session.condominioId)),
    queryFn: () => visitasService.mias(),
    enabled: computed(() => session.condominioId !== null),
    refetchOnWindowFocus: false,
    // Cada visita trae su token (el QR): no se deja en caché
    gcTime: 0,
  });
}

/**
 * Página pública del QR: no hay sesión ni condominio activo, así que la clave lleva el token (que ya identifica
 * el condominio). Es la única excepción a la clave con condominio; no se guarda en caché.
 */
export function useVisitaPublica(token: Ref<string>) {
  return useQuery<VisitaPublica, ApiError>({
    queryKey: computed(() => ['publico', 'visita', token.value] as const),
    queryFn: () => visitasService.publica(token.value),
    enabled: computed(() => token.value !== ''),
    refetchOnWindowFocus: true,
    retry: false,
    gcTime: 0,
  });
}

/** Cada cambio mueve la lista: se vuelve a pedir lo del condominio, también en error. */
function useMutacionVisitas<TDatos, TVariables>(
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
          queryKey: clavesVisitas.todas(contexto.condominioId),
        });
      }
      return undefined;
    },
  });
}

export function useAutorizarVisita() {
  return useMutacionVisitas<VisitaAutorizada, NuevaVisita>((d) => visitasService.autorizar(d));
}

export function useRevocarVisita() {
  return useMutacionVisitas<void, number>((id) => visitasService.revocar(id));
}
