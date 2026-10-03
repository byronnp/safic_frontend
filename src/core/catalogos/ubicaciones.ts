import { useQuery } from '@tanstack/vue-query';

import { api } from '@/core/api/client';
import type { ApiError } from '@/core/api/errors';
import type { ApiRespuesta } from '@/core/api/types';

/** Contrato: components/schemas/Provincia (GET /ubicaciones). Códigos INEC. */
export interface Parroquia {
  codigo: string;
  nombre: string;
}

export interface Canton {
  codigo: string;
  nombre: string;
  latitud: string | null;
  longitud: string | null;
  parroquias: Parroquia[];
}

export interface Provincia {
  codigo: string;
  nombre: string;
  latitud: string | null;
  longitud: string | null;
  cantones: Canton[];
}

export const ubicacionesService = {
  async listar(): Promise<Provincia[]> {
    const { data } = await api.get<ApiRespuesta<Provincia[]>>('/ubicaciones');
    return data.data;
  },
};

/**
 * División territorial del Ecuador. Es un catálogo global (no depende del
 * condominio), así que su clave no lleva condominioId y no caduca en la sesión.
 */
export function useUbicaciones() {
  return useQuery<Provincia[], ApiError>({
    queryKey: ['catalogo', 'ubicaciones'],
    queryFn: () => ubicacionesService.listar(),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
