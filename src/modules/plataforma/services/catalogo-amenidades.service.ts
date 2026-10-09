import { api } from '@/core/api/client';
import type { ApiRespuesta } from '@/core/api/types';
import type { CategoriaAmenidad } from '@/modules/configuracion/services/amenidades.service';

/** Tipos del contrato (safic_backend/docs/openapi.yaml · Plataforma · catálogo de amenidades). */
export interface TipoCatalogo {
  id: number;
  nombre: string;
  descripcion: string | null;
  categoria: CategoriaAmenidad;
  reservable: boolean;
  /** Nunca se restringe a morosos (Decreto 462). */
  esencial: boolean;
  requiere_aprobacion: boolean;
  capacidad: number | null;
  duracion_maxima_min: number | null;
  orden: number;
  activa: boolean;
  /** En cuántos condominios se usa; null cuando no se calcula. */
  uso: number | null;
}

export interface AmenidadPropia {
  id: number;
  condominio_id: number;
  condominio: string;
  nombre: string;
  categoria: CategoriaAmenidad | null;
  reservable: boolean;
  esencial: boolean;
  requiere_aprobacion: boolean;
  activa: boolean;
}

/** Al editar solo viaja lo que cambia. */
export interface GuardarTipoCatalogo {
  nombre?: string;
  descripcion?: string | null;
  categoria?: CategoriaAmenidad;
  reservable?: boolean;
  esencial?: boolean;
  requiere_aprobacion?: boolean;
  capacidad?: number | null;
  duracion_maxima_min?: number | null;
  orden?: number;
  activa?: boolean;
}

const BASE = '/plataforma/catalogo-amenidades';

/** Panel del super admin: no depende de un condominio (no lleva X-Condominio-Id). */
export const catalogoAmenidadesService = {
  async listar(): Promise<TipoCatalogo[]> {
    const { data } = await api.get<ApiRespuesta<TipoCatalogo[]>>(BASE);
    return data.data;
  },

  async propias(): Promise<AmenidadPropia[]> {
    const { data } = await api.get<ApiRespuesta<AmenidadPropia[]>>(`${BASE}/propias`);
    return data.data;
  },

  async crear(datos: GuardarTipoCatalogo): Promise<TipoCatalogo> {
    const { data } = await api.post<ApiRespuesta<TipoCatalogo>>(BASE, datos);
    return data.data;
  },

  async editar(id: number, datos: GuardarTipoCatalogo): Promise<TipoCatalogo> {
    const { data } = await api.patch<ApiRespuesta<TipoCatalogo>>(`${BASE}/${id}`, datos);
    return data.data;
  },

  async eliminar(id: number): Promise<void> {
    await api.delete(`${BASE}/${id}`);
  },

  async promover(condominioId: number, amenidadId: number): Promise<TipoCatalogo> {
    const { data } = await api.post<ApiRespuesta<TipoCatalogo>>(
      `${BASE}/propias/${condominioId}/${amenidadId}/promover`,
    );
    return data.data;
  },
};
