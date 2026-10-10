import { api } from '@/core/api/client';
import type { ApiRespuesta } from '@/core/api/types';

/** Tipos del contrato (safic_backend/docs/openapi.yaml · Amenidades). */
export type CategoriaAmenidad = 'recreacion' | 'deporte' | 'social' | 'servicios' | 'seguridad';
export type OrigenAmenidad = 'catalogo' | 'propia';
export type EstadoAmenidad = 'disponible' | 'mantenimiento' | 'inactiva';

export interface FotoAmenidad {
  id: number;
  /** 1 es la portada. */
  orden: number;
  /** Enlace temporal (10 minutos) del bucket privado: no se guarda. */
  url: string;
}

export interface AmenidadCondominio {
  id: number;
  nombre: string;
  origen: OrigenAmenidad;
  /** Tipo del catálogo ("Área BBQ"); null si es propia. */
  tipo: string | null;
  categoria: CategoriaAmenidad | null;
  cantidad: number;
  ubicacion: string | null;
  reservable: boolean;
  /** Nunca se restringe por mora (Decreto 462). */
  esencial: boolean;
  requiere_aprobacion: boolean;
  capacidad: number | null;
  duracion_maxima_min: number | null;
  estado: EstadoAmenidad;
  /** AAAA-MM-DD; solo en mantenimiento. */
  mantenimiento_hasta: string | null;
  /** Hasta 5; la primera es la portada. */
  fotos: FotoAmenidad[];
}

export interface TipoCatalogo {
  id: number;
  nombre: string;
  categoria: CategoriaAmenidad;
  descripcion: string | null;
  reservable: boolean;
  esencial: boolean;
  requiere_aprobacion: boolean;
}

export interface AgregarAmenidad {
  origen: OrigenAmenidad;
  amenidad_catalogo_id?: number;
  nombre?: string;
  categoria?: CategoriaAmenidad;
  reservable?: boolean;
  cantidad: number;
  ubicacion: string | null;
}

/** Solo viaja lo que cambia. */
export interface ActualizarAmenidad {
  ubicacion?: string | null;
  activa?: boolean;
  /** null saca la amenidad de mantenimiento. */
  mantenimiento_hasta?: string | null;
}

/** El condominio va en el header X-Condominio-Id (lo agrega el cliente HTTP). */
export const amenidadesService = {
  async listar(): Promise<AmenidadCondominio[]> {
    const { data } = await api.get<ApiRespuesta<AmenidadCondominio[]>>('/amenidades');
    return data.data;
  },

  async catalogo(): Promise<TipoCatalogo[]> {
    const { data } = await api.get<ApiRespuesta<TipoCatalogo[]>>('/amenidades/catalogo');
    return data.data;
  },

  async agregar(datos: AgregarAmenidad): Promise<AmenidadCondominio[]> {
    const { data } = await api.post<ApiRespuesta<AmenidadCondominio[]>>('/amenidades', datos);
    return data.data;
  },

  async actualizar(id: number, datos: ActualizarAmenidad): Promise<AmenidadCondominio> {
    const { data } = await api.patch<ApiRespuesta<AmenidadCondominio>>(`/amenidades/${id}`, datos);
    return data.data;
  },

  async subirFoto(id: number, foto: File): Promise<AmenidadCondominio> {
    const formulario = new FormData();
    formulario.append('foto', foto);
    const { data } = await api.post<ApiRespuesta<AmenidadCondominio>>(
      `/amenidades/${id}/fotos`,
      formulario,
    );
    return data.data;
  },

  async quitarFoto(id: number, fotoId: number): Promise<AmenidadCondominio> {
    const { data } = await api.delete<ApiRespuesta<AmenidadCondominio>>(
      `/amenidades/${id}/fotos/${fotoId}`,
    );
    return data.data;
  },

  /** La lista completa de ids en el orden nuevo (la primera es la portada). */
  async ordenarFotos(id: number, ids: number[]): Promise<AmenidadCondominio> {
    const { data } = await api.put<ApiRespuesta<AmenidadCondominio>>(
      `/amenidades/${id}/fotos/orden`,
      { ids },
    );
    return data.data;
  },
};
