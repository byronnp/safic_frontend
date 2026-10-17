import { api } from '@/core/api/client';
import { pedirArchivo } from '@/core/api/descarga';
import type { ApiRespuesta } from '@/core/api/types';

/** Tipos del contrato (safic_backend/docs/openapi.yaml · Finanzas · reportes). Los montos son texto decimal. */
export type ClaveReporte =
  | 'ingresos_gastos'
  | 'cartera_antiguedad'
  | 'recaudacion_mensual'
  | 'conciliaciones'
  | 'gastos_proveedor'
  | 'estados_cuenta';

export type TipoColumna = 'texto' | 'dinero' | 'entero' | 'porcentaje';

export interface Reporte {
  reporte: ClaveReporte;
  titulo: string;
  periodo: string;
  columnas: { clave: string; etiqueta: string; tipo: TipoColumna }[];
  filas: Record<string, string | number | null>[];
}

export interface Exportacion {
  id: number;
  codigo: string;
  reporte: string;
  titulo: string;
  formato: 'xlsx';
  filas: number;
  user_nombre: string;
  user_rol: string | null;
  /** ISO 8601. */
  en: string;
}

export const reportesService = {
  async ver(reporte: ClaveReporte, periodo: string): Promise<Reporte> {
    const { data } = await api.get<ApiRespuesta<Reporte>>(`/finanzas/reportes/${reporte}`, {
      params: { periodo },
    });
    return data.data;
  },

  /** El Excel del reporte; cuenta para el límite diario y queda en la bitácora de exportaciones. */
  excel(reporte: ClaveReporte, periodo: string): Promise<Blob> {
    return pedirArchivo(
      `/finanzas/reportes/${reporte}/excel?periodo=${encodeURIComponent(periodo)}`,
    );
  },

  async exportaciones(): Promise<Exportacion[]> {
    const { data } = await api.get<ApiRespuesta<Exportacion[]>>('/finanzas/exportaciones');
    return data.data;
  },
};
