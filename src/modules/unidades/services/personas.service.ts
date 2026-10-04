import { api } from '@/core/api/client';
import type { ApiRespuesta, Paginacion } from '@/core/api/types';

export type TipoDocumento = 'cedula' | 'ruc' | 'pasaporte';

/**
 * Persona del condominio. Documento, teléfono y correo llegan enmascarados
 * ("17••••••89") si el rol no tiene residentes.ver_datos: se muestran tal cual.
 */
export interface Persona {
  id: number;
  tipo_documento: TipoDocumento;
  documento: string;
  nombres: string;
  apellidos: string;
  nombre_completo: string;
  telefono: string | null;
  email: string | null;
  datos_enmascarados: boolean;
}

export interface GuardarPersona {
  tipo_documento: TipoDocumento;
  documento: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string | null;
}

export interface PaginaPersonas {
  personas: Persona[];
  paginacion: Paginacion;
}

/** El condominio va en el header X-Condominio-Id (lo agrega el cliente HTTP). */
export const personasService = {
  /** Busca por nombre (contiene) o por documento exacto. */
  async listar(
    filtro: { buscar?: string; pagina?: number; porPagina?: number } = {},
  ): Promise<PaginaPersonas> {
    const { data } = await api.get<ApiRespuesta<Persona[]>>('/personas', {
      params: {
        buscar: filtro.buscar?.trim() || undefined,
        page: filtro.pagina ?? 1,
        por_pagina: filtro.porPagina,
      },
    });
    return {
      personas: data.data,
      paginacion: data.meta?.pagination ?? {
        page: 1,
        per_page: data.data.length,
        total: data.data.length,
        last_page: 1,
      },
    };
  },

  async crear(datos: GuardarPersona): Promise<Persona> {
    const { data } = await api.post<ApiRespuesta<Persona>>('/personas', datos);
    return data.data;
  },
};
