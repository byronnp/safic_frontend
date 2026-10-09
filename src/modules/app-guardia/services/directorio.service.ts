import { api } from '@/core/api/client';
import type { ApiRespuesta } from '@/core/api/types';

import type { RelacionOcupante, TipoUnidad } from '@/modules/unidades/services/unidades.service';

/** Tipos del contrato (safic_backend/docs/openapi.yaml · GET /garita/directorio). */
export interface DirectorioOcupante {
  nombre: string;
  relacion: RelacionOcupante;
  /** Completo (sin enmascarar): el guardia llama desde aquí. */
  telefono: string | null;
}

export interface DirectorioVehiculo {
  /** Normalizada: "PBC-4821". */
  placa: string;
  /** Marca, modelo y color; puede venir vacía. */
  descripcion: string;
  /** La placa coincide con la búsqueda. */
  coincide: boolean;
}

export interface DirectorioUnidad {
  unidad: { id: number; codigo: string; tipo: TipoUnidad; bloque: string | null };
  ocupantes: DirectorioOcupante[];
  vehiculos: DirectorioVehiculo[];
}

/** El condominio va en el header X-Condominio-Id (lo agrega el cliente HTTP). */
export const directorioService = {
  async buscar(texto: string): Promise<DirectorioUnidad[]> {
    const { data } = await api.get<ApiRespuesta<DirectorioUnidad[]>>('/garita/directorio', {
      params: { buscar: texto.trim() },
    });
    return data.data;
  },
};
