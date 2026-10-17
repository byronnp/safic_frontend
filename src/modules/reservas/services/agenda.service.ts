import { api } from '@/core/api/client';
import type { ApiRespuesta } from '@/core/api/types';

/** Tipos del contrato (safic_backend/docs/openapi.yaml · Reservas · agenda). Los montos son texto decimal. */
export interface AreaAgenda {
  id: number;
  nombre: string;
  capacidad: number | null;
  costo: string;
  garantia: string;
  duracion_max_horas: number | null;
  configurada: boolean;
  en_mantenimiento: boolean;
}

export interface ReservaAgenda {
  id: number;
  amenidad_id: number;
  unidad: string;
  fecha: string;
  inicio: string;
  fin: string;
  estado: 'pendiente' | 'confirmada' | 'en_uso';
}

export interface BloqueoAgenda {
  id: number;
  amenidad_id: number;
  fecha: string;
  /** null = todo el día */
  inicio: string | null;
  fin: string | null;
  motivo: string;
}

export interface Agenda {
  desde: string;
  hasta: string;
  areas: AreaAgenda[];
  reservas: ReservaAgenda[];
  bloqueos: BloqueoAgenda[];
}

export interface Solicitud {
  id: number;
  area: string;
  unidad: string;
  solicitante: string | null;
  fecha: string;
  inicio: string;
  fin: string;
  costo: string;
  garantia: string;
  /** La unidad no está en mora. */
  unidad_al_dia: boolean;
  unidad_restringida: boolean;
  solicitada_en: string;
  vence_en: string;
}

export interface NuevoBloqueo {
  amenidad_id: number;
  fecha: string;
  inicio: string | null;
  fin: string | null;
  motivo: string;
  cancelar_reservas: boolean;
}

export const agendaService = {
  async agenda(desde: string, dias: number): Promise<Agenda> {
    const { data } = await api.get<ApiRespuesta<Agenda>>('/areas-comunes/agenda', {
      params: { desde, dias },
    });
    return data.data;
  },

  async solicitudes(): Promise<Solicitud[]> {
    const { data } = await api.get<ApiRespuesta<Solicitud[]>>('/areas-comunes/solicitudes');
    return data.data;
  },

  async aprobar(id: number): Promise<void> {
    await api.post(`/areas-comunes/reservas/${id}/aprobar`);
  },

  async rechazar(id: number, motivo: string): Promise<void> {
    await api.post(`/areas-comunes/reservas/${id}/rechazar`, { motivo });
  },

  async cancelar(id: number, motivo: string): Promise<void> {
    await api.post(`/areas-comunes/reservas/${id}/cancelar`, { motivo });
  },

  async bloquear(datos: NuevoBloqueo): Promise<{ reservasCanceladas: number }> {
    const { data } = await api.post<ApiRespuesta<{ id: number; reservas_canceladas: number }>>(
      '/areas-comunes/bloqueos',
      datos,
    );
    return { reservasCanceladas: data.data.reservas_canceladas };
  },

  async desbloquear(id: number): Promise<void> {
    await api.delete(`/areas-comunes/bloqueos/${id}`);
  },
};
