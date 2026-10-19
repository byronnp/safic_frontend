import { api } from '@/core/api/client';
import type { ApiRespuesta } from '@/core/api/types';

/** Tipos del contrato (safic_backend/docs/openapi.yaml · Reservas · garantías). Los montos son texto decimal. */
export type EstadoGarantia = 'esperando_decision' | 'por_devolver' | 'devuelta';
export type FormaDevolucion = 'efectivo' | 'transferencia';

export interface GarantiaReserva {
  reserva_id: number;
  area: string;
  unidad: string;
  /** Día del uso (`YYYY-MM-DD`). */
  fecha: string;
  garantia: string;
  estado: EstadoGarantia;
  /** Lo que se devuelve (lo ya devuelto si `devuelta`; «0.00» si espera la decisión de los daños). */
  monto: string;
  devolucion: {
    forma: FormaDevolucion | null;
    fecha: string | null;
    referencia: string | null;
  } | null;
}

export interface ListaGarantias {
  por_devolver: number;
  total_por_devolver: string;
  garantias: GarantiaReserva[];
}

export interface DevolverGarantia {
  forma: FormaDevolucion;
  /** Día en que se entregó el dinero (`YYYY-MM-DD`). */
  fecha: string;
  referencia?: string;
}

export const garantiasService = {
  async lista(): Promise<ListaGarantias> {
    const { data } = await api.get<ApiRespuesta<ListaGarantias>>('/areas-comunes/garantias');
    return data.data;
  },

  /** El monto lo calcula el servidor: no se envía. */
  async devolver(reservaId: number, datos: DevolverGarantia): Promise<void> {
    await api.post(`/areas-comunes/reservas/${reservaId}/garantia/devolver`, datos);
  },
};
