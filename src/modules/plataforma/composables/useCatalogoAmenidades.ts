import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import type { Ref } from 'vue';

import type { ApiError } from '@/core/api/errors';

import {
  catalogoAmenidadesService,
  type AmenidadPropia,
  type GuardarTipoCatalogo,
  type TipoCatalogo,
} from '../services/catalogo-amenidades.service';

/** Datos del panel de plataforma: no dependen de un condominio (`['plataforma', …]`). */
export const clavesCatalogoAmenidades = {
  todas: ['plataforma', 'catalogo-amenidades'] as const,
  tipos: ['plataforma', 'catalogo-amenidades', 'tipos'] as const,
  propias: ['plataforma', 'catalogo-amenidades', 'propias'] as const,
};

export function useTiposCatalogo() {
  return useQuery<TipoCatalogo[], ApiError>({
    queryKey: clavesCatalogoAmenidades.tipos,
    queryFn: () => catalogoAmenidadesService.listar(),
    refetchOnWindowFocus: false,
  });
}

/**
 * Las propias recorren todos los condominios en el servidor: solo se piden cuando se
 * abre esa pestaña.
 */
export function usePropiasCatalogo(activo: Ref<boolean>) {
  return useQuery<AmenidadPropia[], ApiError>({
    queryKey: clavesCatalogoAmenidades.propias,
    queryFn: () => catalogoAmenidadesService.propias(),
    enabled: activo,
    refetchOnWindowFocus: false,
  });
}

/** Toda mutación cambia el catálogo y las propias: se vuelven a pedir (también en error). */
function useMutacionCatalogo<TDatos, TVariables>(
  ejecutar: (variables: TVariables) => Promise<TDatos>,
) {
  const queryClient = useQueryClient();

  return useMutation<TDatos, ApiError, TVariables>({
    mutationFn: ejecutar,
    onSettled: () => queryClient.invalidateQueries({ queryKey: clavesCatalogoAmenidades.todas }),
  });
}

export function useCrearTipo() {
  return useMutacionCatalogo<TipoCatalogo, GuardarTipoCatalogo>((datos) =>
    catalogoAmenidadesService.crear(datos),
  );
}

export function useEditarTipo() {
  return useMutacionCatalogo<TipoCatalogo, { id: number; datos: GuardarTipoCatalogo }>(
    ({ id, datos }) => catalogoAmenidadesService.editar(id, datos),
  );
}

export function useEliminarTipo() {
  return useMutacionCatalogo<void, number>((id) => catalogoAmenidadesService.eliminar(id));
}

export function usePromoverPropia() {
  return useMutacionCatalogo<TipoCatalogo, { condominioId: number; amenidadId: number }>(
    ({ condominioId, amenidadId }) => catalogoAmenidadesService.promover(condominioId, amenidadId),
  );
}
