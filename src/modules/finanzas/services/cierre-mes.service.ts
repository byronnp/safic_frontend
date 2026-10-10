import { api } from '@/core/api/client';
import type { ApiRespuesta } from '@/core/api/types';

/** Tipos del contrato (safic_backend/docs/openapi.yaml · Finanzas · cierre de mes). Los montos son texto decimal. */
export type EstadoVerificacion = 'listo' | 'revisar' | 'bloquea';

export interface Verificacion {
  clave: string;
  titulo: string;
  detalle: string;
  estado: EstadoVerificacion;
}

export interface CierreMes {
  periodo: string;
  emitido: boolean;
  estado: 'abierto' | 'cerrado' | null;
  verificaciones: Verificacion[];
  puede_cerrar: boolean;
  motivo_bloqueo: string | null;
  resumen: { emitido: string; cobrado: string; gastos_pagados: string };
  cierre: { cerrado_por: string | null; cerrado_en: string | null } | null;
  reapertura: { reabierto_por: string | null; reabierto_en: string; motivo: string | null } | null;
  anterior_cerrado: { periodo: string; por: string | null } | null;
}

export const cierreMesService = {
  async ver(periodo: string): Promise<CierreMes> {
    const { data } = await api.get<ApiRespuesta<CierreMes>>(`/finanzas/periodos/${periodo}/cierre`);
    return data.data;
  },

  async cerrar(periodo: string): Promise<CierreMes> {
    const { data } = await api.post<ApiRespuesta<CierreMes>>(
      `/finanzas/periodos/${periodo}/cerrar`,
    );
    return data.data;
  },

  async reabrir(periodo: string, motivo: string): Promise<CierreMes> {
    const { data } = await api.post<ApiRespuesta<CierreMes>>(
      `/finanzas/periodos/${periodo}/reabrir`,
      {
        motivo,
      },
    );
    return data.data;
  },
};
