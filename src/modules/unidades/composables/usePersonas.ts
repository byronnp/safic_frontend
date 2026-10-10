import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import {
  personasService,
  type AccesoResidente,
  type GuardarPersona,
  type PaginaPersonas,
  type Persona,
} from '../services/personas.service';
import { clavesUnidades } from './useUnidades';

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

/** Da acceso a la app a una persona; la ficha y las unidades se vuelven a pedir (llevan `tiene_acceso`). */
export function useDarAccesoPersona() {
  const session = useSessionStore();
  const queryClient = useQueryClient();

  return useMutation<AccesoResidente, ApiError, number, { condominioId: number | null }>({
    mutationFn: (personaId) => personasService.darAcceso(personaId),
    // El condominio de la petición, no el de cuando responde
    onMutate: () => ({ condominioId: session.condominioId }),
    onSettled: (_datos, _error, _personaId, contexto) => {
      const condominioId = contexto?.condominioId ?? null;
      if (condominioId === null) return;
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: clavesUnidades.todas(condominioId) }),
        queryClient.invalidateQueries({ queryKey: clavesPersonas.todas(condominioId) }),
      ]);
    },
  });
}
