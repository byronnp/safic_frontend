import { api } from '@/core/api/client';
import { ApiError } from '@/core/api/errors';
import type { ApiRespuesta, Paginacion } from '@/core/api/types';
import type { MetodoCobro } from '@/modules/unidades/services/unidades.service';

/** Tipos del contrato (safic_backend/docs/openapi.yaml · Finanzas · /finanzas/cuotas). Los montos son texto decimal. */
export type EstadoCuota = 'pagada' | 'por_aprobar' | 'vencida' | 'pendiente';
export type FiltroCuotas = 'todas' | EstadoCuota;

export interface CuotaUnidad {
  unidad_id: number;
  codigo: string;
  responsable: { nombre: string; relacion: string } | null;
  cuota: string;
  pagado: string;
  saldo: string;
  vence_el: string;
  estado: EstadoCuota;
}

export interface ResumenCuotas {
  emitido: { monto: string; unidades: number };
  cobrado: { monto: string; porcentaje: number };
  por_aprobar: { monto: string; comprobantes: number };
  vencido_anterior: { monto: string; unidades: number };
  emitida: boolean;
  estado: 'abierto' | 'cerrado' | null;
  /** ISO 8601 en la hora de Ecuador. */
  emitido_en: string | null;
  metodo: MetodoCobro | null;
  dia_vencimiento: number | null;
}

export interface ListaCuotas {
  unidades: CuotaUnidad[];
  periodo: string;
  resumen: ResumenCuotas;
  conteos: Record<FiltroCuotas, number>;
  paginacion: Paginacion;
}

export interface FiltroListaCuotas {
  periodo?: string;
  filtro: FiltroCuotas;
  buscar: string;
  pagina: number;
}

export interface NuevaCuotaExtraordinaria {
  detalle: string;
  periodo: string;
  vence_el: string;
  modo: 'por_unidad' | 'alicuota';
  monto: string;
}

export interface CuotaExtraordinariaCreada {
  creadas: number;
  total: string;
  vence_el: string;
}

export const cuotasService = {
  async listar(f: FiltroListaCuotas): Promise<ListaCuotas> {
    const { data } = await api.get<ApiRespuesta<CuotaUnidad[]>>('/finanzas/cuotas', {
      params: {
        ...(f.periodo ? { periodo: f.periodo } : {}),
        filtro: f.filtro,
        ...(f.buscar.trim() !== '' ? { buscar: f.buscar.trim() } : {}),
        page: f.pagina,
      },
    });
    const meta = data.meta as
      | (Record<string, unknown> & {
          periodo: string;
          resumen: ResumenCuotas;
          conteos: Record<FiltroCuotas, number>;
          pagination: Paginacion;
        })
      | undefined;
    if (!meta?.resumen || !meta.conteos || !meta.pagination) {
      throw new ApiError('RESPUESTA_INVALIDA', 'La respuesta del servidor no es válida.', 200);
    }
    return {
      unidades: data.data,
      periodo: meta.periodo ?? f.periodo ?? '',
      resumen: meta.resumen,
      conteos: meta.conteos,
      paginacion: meta.pagination,
    };
  },

  async crearExtraordinaria(datos: NuevaCuotaExtraordinaria): Promise<CuotaExtraordinariaCreada> {
    const { data } = await api.post<ApiRespuesta<CuotaExtraordinariaCreada>>(
      '/finanzas/cuotas-extraordinarias',
      datos,
    );
    return data.data;
  },
};
