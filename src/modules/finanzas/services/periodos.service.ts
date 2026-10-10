import { api } from '@/core/api/client';
import type { ApiRespuesta } from '@/core/api/types';
import type { MetodoCobro } from '@/modules/unidades/services/unidades.service';

/** Tipos del contrato (safic_backend/docs/openapi.yaml · Finanzas · periodos y resumen). Los montos son texto decimal. */
export interface PeriodoFinanciero {
  /** `YYYY-MM`. */
  periodo: string;
  estado: 'abierto' | 'cerrado';
  esperado: string;
  recaudado: string;
}

export interface EmisionPeriodo {
  periodo: string;
  creadas: number;
  existentes: number;
  sin_cuota: number;
  total: string;
  vence_el: string;
}

export type TramoCartera = 'al_dia' | 'd1_30' | 'd31_60' | 'd61_90' | 'd90_mas';

export interface ResumenFinanciero {
  periodo: string;
  emitido: boolean;
  estado: 'abierto' | 'cerrado' | null;
  esperado: string;
  recaudado: string;
  cuotas: number;
  cartera_vencida: { saldo: string; unidades: number };
  antiguedad: { tramo: TramoCartera; etiqueta: string; saldo: string; unidades: number }[];
  cobro: { metodo: MetodoCobro; dia_vencimiento: number } | null;
}

export const periodosService = {
  async listar(): Promise<PeriodoFinanciero[]> {
    const { data } = await api.get<ApiRespuesta<PeriodoFinanciero[]>>('/finanzas/periodos');
    return data.data;
  },

  /** Sin `periodo`, el mes en curso. */
  async resumen(periodo?: string): Promise<ResumenFinanciero> {
    const { data } = await api.get<ApiRespuesta<ResumenFinanciero>>('/finanzas/resumen', {
      ...(periodo ? { params: { periodo } } : {}),
    });
    return data.data;
  },

  async emitir(periodo: string): Promise<EmisionPeriodo> {
    const { data } = await api.post<ApiRespuesta<EmisionPeriodo>>('/finanzas/periodos', {
      periodo,
    });
    return data.data;
  },
};
