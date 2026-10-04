import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import {
  personasService,
  type GuardarPersona,
  type PaginaPersonas,
  type Persona,
} from '../services/personas.service';

/** Claves de caché: siempre incluyen el condominio activo. */
export const clavesPersonas = {
  todas: (condominioId: number | null) => ['personas', condominioId] as const,
  busqueda: (condominioId: number | null, buscar: string) =>
    ['personas', condominioId, 'busqueda', buscar] as const,
};

/** Búsqueda para elegir una persona (nombre o documento exacto). */
export function useBuscarPersonas(buscar: Ref<string>) {
  const session = useSessionStore();

  return useQuery<PaginaPersonas, ApiError>({
    queryKey: computed(() => clavesPersonas.busqueda(session.condominioId, buscar.value.trim())),
    queryFn: () => personasService.listar({ buscar: buscar.value, porPagina: 20 }),
    enabled: computed(() => session.condominioId !== null),
    placeholderData: (anterior) => anterior,
  });
}

export function useCrearPersona() {
  const session = useSessionStore();
  const queryClient = useQueryClient();

  return useMutation<Persona, ApiError, GuardarPersona>({
    mutationFn: (datos) => personasService.crear(datos),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: clavesPersonas.todas(session.condominioId) }),
  });
}
