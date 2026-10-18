import { api } from '@/core/api/client';
import type { ApiRespuesta } from '@/core/api/types';

/** Tipos del contrato (safic_backend/docs/openapi.yaml · Comunicación · incidencias). */
export type CategoriaIncidencia =
  'mantenimiento' | 'convivencia' | 'seguridad' | 'areas_verdes' | 'otro';
export type PrioridadIncidencia = 'alta' | 'media' | 'baja';
export type EstadoIncidencia = 'abierto' | 'en_proceso' | 'resuelto' | 'cerrado';

export interface ComentarioIncidencia {
  id: number;
  autor: string;
  de_administracion: boolean;
  /** Nota interna: solo la ve la administración. */
  interna: boolean;
  texto: string;
  creado_en: string;
}

export interface IncidenciaDetalle {
  id: number;
  numero: number;
  titulo: string;
  descripcion: string;
  categoria: CategoriaIncidencia;
  prioridad: PrioridadIncidencia;
  estado: EstadoIncidencia;
  /** null = áreas comunes */
  unidad: string | null;
  autor: string | null;
  creada_en: string;
  resuelta_en: string | null;
  cierre: 'residente' | 'automatico' | 'administracion' | null;
  fotos: { id: number; url: string | null }[];
  comentarios: ComentarioIncidencia[];
}

export interface FilaTablero {
  id: number;
  numero: number;
  titulo: string;
  categoria: CategoriaIncidencia;
  prioridad: PrioridadIncidencia;
  estado: EstadoIncidencia;
  unidad: string | null;
  creada_en: string;
}

export interface TableroIncidencias {
  /** Horas hasta la primera respuesta, últimos 30 días; null si no hay datos. */
  tiempo_promedio_horas: number | null;
  incidencias: FilaTablero[];
}

export interface NuevaIncidencia {
  titulo: string;
  descripcion: string;
  categoria: CategoriaIncidencia;
  unidad_id: number | null;
  fotos: File[];
}

export const incidenciasService = {
  async tablero(): Promise<TableroIncidencias> {
    const { data } = await api.get<ApiRespuesta<TableroIncidencias>>('/comunicacion/incidencias');
    return data.data;
  },

  async detalle(id: number): Promise<IncidenciaDetalle> {
    const { data } = await api.get<ApiRespuesta<IncidenciaDetalle>>(
      `/comunicacion/incidencias/${id}`,
    );
    return data.data;
  },

  async comentar(id: number, texto: string, interna: boolean): Promise<void> {
    await api.post(`/comunicacion/incidencias/${id}/comentarios`, { texto, interna });
  },

  async cambiarEstado(id: number, estado: EstadoIncidencia): Promise<void> {
    await api.post(`/comunicacion/incidencias/${id}/estado`, { estado });
  },

  async ajustar(
    id: number,
    cambios: { prioridad?: PrioridadIncidencia; categoria?: CategoriaIncidencia },
  ): Promise<void> {
    await api.patch(`/comunicacion/incidencias/${id}`, cambios);
  },

  async mias(): Promise<IncidenciaDetalle[]> {
    const { data } = await api.get<ApiRespuesta<IncidenciaDetalle[]>>('/mis-incidencias');
    return data.data;
  },

  async reportar(d: NuevaIncidencia): Promise<{ numero: number }> {
    const f = new FormData();
    f.append('titulo', d.titulo);
    f.append('descripcion', d.descripcion);
    f.append('categoria', d.categoria);
    if (d.unidad_id !== null) f.append('unidad_id', String(d.unidad_id));
    d.fotos.forEach((foto) => f.append('fotos[]', foto));
    const { data } = await api.post<ApiRespuesta<{ id: number; numero: number }>>(
      '/mis-incidencias',
      f,
    );
    return { numero: data.data.numero };
  },

  async comentarMia(id: number, texto: string): Promise<void> {
    await api.post(`/mis-incidencias/${id}/comentarios`, { texto });
  },

  async reabrir(id: number, texto: string | null): Promise<void> {
    await api.post(`/mis-incidencias/${id}/reabrir`, { texto });
  },

  async confirmar(id: number): Promise<void> {
    await api.post(`/mis-incidencias/${id}/confirmar`);
  },
};
