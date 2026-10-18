import { api } from '@/core/api/client';
import type { ApiRespuesta } from '@/core/api/types';

import type { AutorizadoPor } from './garita.service';

/** Tipos del contrato (safic_backend/docs/openapi.yaml · Garita · visitas). */
export type TipoVisita = 'unica' | 'recurrente';

export interface VisitaAutorizada {
  id: number;
  unidad: string;
  visitante: string;
  placa: string | null;
  tipo: TipoVisita;
  fecha_desde: string;
  fecha_hasta: string;
  hora_desde: string;
  hora_hasta: string;
  /** 1 = lunes … 7 = domingo */
  dias_semana: number[] | null;
  /** Es el QR: opaco, sin datos personales. */
  token: string;
}

export interface IngresoMiUnidad {
  id: number;
  nombre: string;
  tipo: 'visita' | 'proveedor' | 'delivery';
  autorizado_por: AutorizadoPor;
  estado: 'dentro' | 'salio';
  entrada_en: string;
  salida_en: string | null;
}

export interface MisVisitas {
  unidades: { unidad_id: number; codigo: string }[];
  visitas: VisitaAutorizada[];
  /** Los últimos ingresos a mis unidades que registró la garita. */
  ingresos: IngresoMiUnidad[];
}

/** Alguien espera en la garita y el guardia pregunta si lo deja pasar. */
export interface SolicitudDeIngreso {
  id: number;
  nombre: string;
  tipo: 'visita' | 'delivery' | 'proveedor';
  placa: string | null;
  unidad: string;
  creada_en: string;
  segundos_restantes: number;
}

export interface NuevaVisita {
  unidad_id: number;
  visitante: string;
  documento: string | null;
  placa: string | null;
  tipo: TipoVisita;
  fecha_desde: string;
  fecha_hasta: string | null;
  hora_desde: string;
  hora_hasta: string;
  dias_semana: number[] | null;
}

export interface VisitaPublica {
  token: string;
  estado: 'activa' | 'revocada' | 'vencida';
  /** Solo el nombre de pila. */
  visitante: string;
  tipo: TipoVisita;
  unidad: string | null;
  fecha_desde: string;
  fecha_hasta: string;
  hora_desde: string;
  hora_hasta: string;
  dias_semana: number[] | null;
  condominio: {
    nombre: string;
    direccion: string | null;
    latitud: string | null;
    longitud: string | null;
  };
}

export const visitasService = {
  async mias(): Promise<MisVisitas> {
    const { data } = await api.get<ApiRespuesta<MisVisitas>>('/mis-visitas');
    return data.data;
  },

  async autorizar(datos: NuevaVisita): Promise<VisitaAutorizada> {
    const { data } = await api.post<ApiRespuesta<VisitaAutorizada>>('/mis-visitas', datos);
    return data.data;
  },

  async revocar(id: number): Promise<void> {
    await api.post(`/mis-visitas/${id}/revocar`);
  },

  async solicitudes(): Promise<SolicitudDeIngreso[]> {
    const { data } = await api.get<ApiRespuesta<SolicitudDeIngreso[]>>('/mis-solicitudes-ingreso');
    return data.data;
  },

  async responder(id: number, permitir: boolean): Promise<void> {
    await api.post(`/mis-solicitudes-ingreso/${id}/responder`, { permitir });
  },

  /** Página pública del QR: sin sesión. */
  async publica(token: string): Promise<VisitaPublica> {
    const { data } = await api.get<ApiRespuesta<VisitaPublica>>(
      `/publico/visitas/${encodeURIComponent(token)}`,
      // Sin sesión: un 401 aquí no debe intentar renovar nada
      { saltarRefresco: true },
    );
    return data.data;
  },
};
