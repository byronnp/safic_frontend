import { api } from '@/core/api/client';
import type { ApiRespuesta } from '@/core/api/types';

/** Tipos del contrato (safic_backend/docs/openapi.yaml · Reservas · daños). Los montos son texto decimal. */
export type DecisionDanos = 'sin_cargo' | 'descontar_garantia' | 'cobrar_cuenta';

export type EstadoGarantiaDanos =
  'esperando_decision' | 'por_devolver' | 'sin_devolucion' | 'devuelta';

export interface ResumenDanos {
  reserva_id: number;
  area: string;
  unidad: string;
  fecha: string;
  danos: string;
  garantia: string;
  decision: DecisionDanos | null;
  garantia_estado: EstadoGarantiaDanos | null;
  /** Lo que queda por devolver de la garantía según la decisión. */
  por_devolver: string | null;
}

export interface ListaDanos {
  pendientes: number;
  danos: ResumenDanos[];
}

export interface ResolucionDanos {
  decision: DecisionDanos;
  monto: string | null;
  nota: string | null;
  garantia_estado: EstadoGarantiaDanos | null;
  por_devolver: string | null;
  cobrada_en_cuota: boolean;
  resuelta_en: string | null;
}

export interface DetalleDanos {
  reserva_id: number;
  area: string;
  unidad: string;
  fecha: string;
  inicio: string;
  fin: string;
  garantia: string;
  danos: string;
  recibida_en: string | null;
  recibida_por: string | null;
  resolucion: ResolucionDanos | null;
  /** Enlaces temporales (10 minutos). */
  fotos: { id: number; url: string | null }[];
}

export interface ResolverDanos {
  decision: DecisionDanos;
  /** Obligatorio salvo «sin cargo». */
  monto?: string;
  nota?: string;
}

export const danosService = {
  async lista(): Promise<ListaDanos> {
    const { data } = await api.get<ApiRespuesta<ListaDanos>>('/areas-comunes/danos');
    return data.data;
  },

  async detalle(reservaId: number): Promise<DetalleDanos> {
    const { data } = await api.get<ApiRespuesta<DetalleDanos>>(
      `/areas-comunes/reservas/${reservaId}/danos`,
    );
    return data.data;
  },

  async resolver(reservaId: number, datos: ResolverDanos): Promise<DetalleDanos> {
    const { data } = await api.post<ApiRespuesta<DetalleDanos>>(
      `/areas-comunes/reservas/${reservaId}/danos/resolver`,
      datos,
    );
    return data.data;
  },
};
