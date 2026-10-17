import { api } from '@/core/api/client';
import type { ApiRespuesta } from '@/core/api/types';

/** Tipos del contrato (safic_backend/docs/openapi.yaml · Reservas · mis reservas). Los montos son texto decimal. */
export interface AreaReservable {
  id: number;
  nombre: string;
  ubicacion: string | null;
  estado: 'disponible' | 'mantenimiento';
  mantenimiento_hasta: string | null;
  requiere_aprobacion: boolean;
  /** Si la unidad en mora no puede reservarla (Decreto 462). */
  restringible_por_mora: boolean;
  capacidad: number | null;
  duracion_min_horas: number;
  duracion_max_horas: number;
  costo: string;
  garantia: string;
  reglamento: string | null;
}

export interface AreasReservables {
  unidades: { unidad_id: number; codigo: string; restringida: boolean }[];
  areas: AreaReservable[];
}

export interface Franja {
  inicio: string;
  fin: string;
  estado: 'libre' | 'ocupada' | 'cerrada';
}

export interface DiaDisponible {
  fecha: string;
  franjas: Franja[];
}

export type EstadoReserva =
  'pendiente' | 'confirmada' | 'en_uso' | 'finalizada' | 'rechazada' | 'cancelada' | 'vencida';

export interface MiReserva {
  id: number;
  area: string;
  unidad: string;
  fecha: string;
  inicio: string;
  fin: string;
  estado: EstadoReserva;
  costo: string;
  garantia: string;
  proxima: boolean;
  puede_cancelar: boolean;
  /** Lo que falta pagar del cobro de la reserva («0.00» si nada). */
  por_pagar: string;
  /** Límite para pagar, hora local «YYYY-MM-DDTHH:MM»; pasado, la reserva se cancela sola. */
  pagar_antes_de: string | null;
  /** Motivo del rechazo o de la cancelación. */
  motivo: string | null;
}

export interface NuevaReserva {
  amenidad_id: number;
  unidad_id: number;
  fecha: string;
  inicio: string;
  horas: number;
  acepta_reglamento: boolean;
}

export const reservasService = {
  async areas(): Promise<AreasReservables> {
    const { data } = await api.get<ApiRespuesta<AreasReservables>>('/mis-reservas/areas');
    return data.data;
  },

  async disponibilidad(amenidadId: number, desde: string, dias: number): Promise<DiaDisponible[]> {
    const { data } = await api.get<ApiRespuesta<DiaDisponible[]>>(
      `/mis-reservas/areas/${amenidadId}/disponibilidad`,
      { params: { desde, dias } },
    );
    return data.data;
  },

  async mias(): Promise<MiReserva[]> {
    const { data } = await api.get<ApiRespuesta<MiReserva[]>>('/mis-reservas');
    return data.data;
  },

  async reservar(datos: NuevaReserva): Promise<MiReserva> {
    const { data } = await api.post<ApiRespuesta<MiReserva>>('/mis-reservas', datos);
    return data.data;
  },

  async cancelar(id: number, motivo: string | null): Promise<void> {
    await api.post(`/mis-reservas/${id}/cancelar`, { motivo });
  },
};
