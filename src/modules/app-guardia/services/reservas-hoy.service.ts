import { api } from '@/core/api/client';
import type { ApiRespuesta } from '@/core/api/types';

/** Tipos del contrato (safic_backend/docs/openapi.yaml · Reservas · garita). Los montos son texto decimal. */
export type EstadoReservaHoy = 'confirmada' | 'en_uso' | 'finalizada';

export interface ReservaHoy {
  id: number;
  area: string;
  unidad: string;
  persona: string | null;
  inicio: string;
  fin: string;
  estado: EstadoReservaHoy;
  costo: string;
  garantia: string;
  /** La unidad tiene la restricción de áreas comunes por mora: no debe ingresar. */
  restringida: boolean;
}

export interface ReservasHoy {
  fecha: string;
  reservas: ReservaHoy[];
}

export const reservasHoyService = {
  async hoy(): Promise<ReservasHoy> {
    const { data } = await api.get<ApiRespuesta<ReservasHoy>>('/garita/reservas-hoy');
    return data.data;
  },

  async ingreso(id: number): Promise<void> {
    await api.post(`/garita/reservas/${id}/ingreso`);
  },

  /** Con fotos el cuerpo va como formulario (multipart); sin ellas, como JSON. Las fotos solo acompañan a un reporte de daños. */
  async entrega(id: number, danos: string | null, fotos: readonly File[] = []): Promise<void> {
    if (fotos.length === 0) {
      await api.post(`/garita/reservas/${id}/entrega`, { danos });
      return;
    }
    const formulario = new FormData();
    formulario.append('danos', danos ?? '');
    fotos.forEach((foto) => formulario.append('fotos[]', foto));
    await api.post(`/garita/reservas/${id}/entrega`, formulario);
  },
};
