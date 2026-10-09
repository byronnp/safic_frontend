import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed } from 'vue';

import type { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import {
  amenidadesService,
  type ActualizarAmenidad,
  type AgregarAmenidad,
  type AmenidadCondominio,
  type TipoCatalogo,
} from '../services/amenidades.service';

/** Claves de caché: siempre incluyen el condominio activo. */
export const clavesAmenidades = {
  todas: (condominioId: number | null) => ['amenidades', condominioId] as const,
  catalogo: (condominioId: number | null) => ['amenidades', condominioId, 'catalogo'] as const,
};

export function useAmenidades() {
  const session = useSessionStore();

  return useQuery<AmenidadCondominio[], ApiError>({
    queryKey: computed(() => clavesAmenidades.todas(session.condominioId)),
    queryFn: () => amenidadesService.listar(),
    enabled: computed(() => session.condominioId !== null),
    refetchOnWindowFocus: false,
  });
}

/** Tipos del catálogo para elegir; se pide solo cuando se abre «Agregar». */
export function useCatalogoAmenidades(activo: () => boolean) {
  const session = useSessionStore();

  return useQuery<TipoCatalogo[], ApiError>({
    queryKey: computed(() => clavesAmenidades.catalogo(session.condominioId)),
    queryFn: () => amenidadesService.catalogo(),
    enabled: computed(() => session.condominioId !== null && activo()),
    staleTime: 5 * 60_000,
  });
}

/**
 * Toda mutación cambia la lista: se vuelve a pedir desde el condominio donde se envió
 * (no el de cuando responde), también en error para no dejar la lista desactualizada.
 */
function useMutacionAmenidades<TDatos, TVariables>(
  ejecutar: (variables: TVariables) => Promise<TDatos>,
) {
  const session = useSessionStore();
  const queryClient = useQueryClient();

  return useMutation<TDatos, ApiError, TVariables, { condominioId: number | null }>({
    mutationFn: ejecutar,
    onMutate: () => ({ condominioId: session.condominioId }),
    onSettled: (_datos, _error, _variables, contexto) => {
      if (contexto?.condominioId != null) {
        void queryClient.invalidateQueries({
          queryKey: clavesAmenidades.todas(contexto.condominioId),
        });
      }
    },
  });
}

export function useAgregarAmenidad() {
  return useMutacionAmenidades<AmenidadCondominio[], AgregarAmenidad>((datos) =>
    amenidadesService.agregar(datos),
  );
}

export function useActualizarAmenidad() {
  return useMutacionAmenidades<AmenidadCondominio, { id: number; datos: ActualizarAmenidad }>(
    ({ id, datos }) => amenidadesService.actualizar(id, datos),
  );
}
