import { api } from '@/core/api/client';
import { ApiError } from '@/core/api/errors';
import type { ApiRespuesta } from '@/core/api/types';

/** Tipos del contrato (safic_backend/docs/openapi.yaml · Finanzas · gastos recurrentes). Los montos son texto decimal. */
export type EstadoMes = 'programado' | 'falta_factura' | 'factura_recibida' | 'pausado';

export interface GastoRecurrente {
  id: number;
  nombre: string;
  proveedor: { id: number; razon_social: string };
  categoria: string | null;
  /** null = monto variable (luz, agua). */
  monto: string | null;
  dia_mes: number;
  activo: boolean;
  aprobacion_automatica: boolean;
  mes: {
    estado: EstadoMes;
    fecha_prevista: string;
    gasto_id: number | null;
    aprobada_automaticamente: boolean;
  };
}

export interface ListaRecurrentes {
  recurrentes: GastoRecurrente[];
  resumen: {
    comprometido: string;
    por_adjuntar: number;
    proximo: { nombre: string; fecha: string } | null;
  };
}

export interface NuevoRecurrente {
  nombre: string;
  proveedor_id: number;
  categoria: string | null;
  monto: string | null;
  dia_mes: number;
  aprobacion_automatica: boolean;
}

export type CambiosRecurrente = Partial<NuevoRecurrente> & { activo?: boolean };

export interface FacturaCandidata {
  id: number;
  numero: string;
  fecha_emision: string;
  total: string;
  estado: string;
}

export const recurrentesService = {
  async listar(periodo: string): Promise<ListaRecurrentes> {
    const { data } = await api.get<ApiRespuesta<GastoRecurrente[]>>('/finanzas/recurrentes', {
      params: { periodo },
    });
    const resumen = (data.meta as { resumen?: ListaRecurrentes['resumen'] } | undefined)?.resumen;
    if (!resumen)
      throw new ApiError('RESPUESTA_INVALIDA', 'La respuesta del servidor no es válida.', 200);
    return { recurrentes: data.data, resumen };
  },

  async crear(datos: NuevoRecurrente): Promise<GastoRecurrente> {
    const { data } = await api.post<ApiRespuesta<GastoRecurrente>>('/finanzas/recurrentes', datos);
    return data.data;
  },

  async editar(id: number, cambios: CambiosRecurrente): Promise<GastoRecurrente> {
    const { data } = await api.patch<ApiRespuesta<GastoRecurrente>>(
      `/finanzas/recurrentes/${id}`,
      cambios,
    );
    return data.data;
  },

  async facturas(id: number): Promise<FacturaCandidata[]> {
    const { data } = await api.get<ApiRespuesta<FacturaCandidata[]>>(
      `/finanzas/recurrentes/${id}/facturas`,
    );
    return data.data;
  },

  async vincular(
    id: number,
    periodo: string,
    gastoId: number,
  ): Promise<{ aprobadaAutomaticamente: boolean }> {
    const { data } = await api.post<
      ApiRespuesta<GastoRecurrente> & { meta: { aprobada_automaticamente: boolean } }
    >(`/finanzas/recurrentes/${id}/factura`, { periodo, gasto_id: gastoId });
    return { aprobadaAutomaticamente: data.meta.aprobada_automaticamente };
  },
};
