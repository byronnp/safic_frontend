import { api } from '@/core/api/client';
import { ApiError } from '@/core/api/errors';
import type { ApiRespuesta, Paginacion } from '@/core/api/types';

/** Tipos del contrato (safic_backend/docs/openapi.yaml · Finanzas · morosidad y convenios). Los montos son texto decimal. */
export type FiltroMorosidad = 'todas' | 'en_mora' | 'restringidas' | 'convenio';

export type SituacionMora =
  | { tipo: 'restringida'; desde: string }
  | { tipo: 'notificada'; restringe_desde: string }
  | { tipo: 'convenio'; cuota: number; de: number; al_dia: boolean }
  | { tipo: 'recordatorio'; fecha: string }
  | { tipo: 'ninguna' };

export interface UnidadMorosa {
  unidad_id: number;
  codigo: string;
  responsable: { nombre: string; relacion: string } | null;
  cuotas_vencidas: number;
  meses_vencidos: number;
  dias_atraso: number;
  saldo_vencido: string;
  en_mora: boolean;
  situacion: SituacionMora;
}

export interface TramoMora {
  tramo: string;
  etiqueta: string;
  unidades: number;
  saldo: string;
}

export interface ReglasMora {
  dias_gracia: number;
  meses_restriccion: number;
  dias_aviso_restriccion: number;
}

export interface ListaMorosidad {
  unidades: UnidadMorosa[];
  resumen: {
    cartera_vencida: { saldo: string; unidades: number };
    total_unidades: number;
    tramos: TramoMora[];
  };
  conteos: Record<FiltroMorosidad, number>;
  reglas: ReglasMora;
  paginacion: Paginacion;
}

export interface FiltroListaMorosidad {
  filtro: FiltroMorosidad;
  buscar: string;
  pagina: number;
}

export interface ResultadoRecordatorios {
  enviados: number;
  sin_correo: number;
  ya_avisadas: number;
}

export interface Convenio {
  id: number;
  unidad_id: number;
  codigo: string;
  responsable: { nombre: string; relacion: string } | null;
  estado: 'activo' | 'cumplido' | 'cancelado';
  motivo_cancelacion: string | null;
  monto_total: string;
  cuotas: number;
  desde: string;
  pagado: string;
  cuotas_cubiertas: number;
  al_dia: boolean | null;
  proxima_cuota_el: string | null;
  plan: { numero: number; vence_el: string; monto: string }[];
}

export const morosidadService = {
  async listar(f: FiltroListaMorosidad): Promise<ListaMorosidad> {
    const { data } = await api.get<ApiRespuesta<UnidadMorosa[]>>('/finanzas/morosidad', {
      params: {
        filtro: f.filtro,
        ...(f.buscar.trim() !== '' ? { buscar: f.buscar.trim() } : {}),
        page: f.pagina,
      },
    });
    const meta = data.meta as
      | {
          resumen?: ListaMorosidad['resumen'];
          conteos?: ListaMorosidad['conteos'];
          reglas?: ReglasMora;
          pagination?: Paginacion;
        }
      | undefined;
    if (!meta?.resumen || !meta.conteos || !meta.reglas || !meta.pagination) {
      throw new ApiError('RESPUESTA_INVALIDA', 'La respuesta del servidor no es válida.', 200);
    }
    return {
      unidades: data.data,
      resumen: meta.resumen,
      conteos: meta.conteos,
      reglas: meta.reglas,
      paginacion: meta.pagination,
    };
  },

  /** Sin `unidadIds` recuerda a todas las que deben. */
  async recordar(unidadIds: number[] | null): Promise<ResultadoRecordatorios> {
    const { data } = await api.post<ApiRespuesta<ResultadoRecordatorios>>(
      '/finanzas/morosidad/recordatorios',
      unidadIds === null ? {} : { unidad_ids: unidadIds },
    );
    return data.data;
  },

  async levantarRestriccion(unidadId: number, motivo: string): Promise<void> {
    await api.post(`/finanzas/morosidad/restricciones/${unidadId}/levantar`, { motivo });
  },

  async convenios(unidadId: number): Promise<Convenio[]> {
    const { data } = await api.get<ApiRespuesta<Convenio[]>>('/finanzas/convenios', {
      params: { unidad_id: unidadId },
    });
    return data.data;
  },

  async crearConvenio(unidadId: number, cuotas: number, primeraCuotaEl: string): Promise<Convenio> {
    const { data } = await api.post<ApiRespuesta<Convenio>>('/finanzas/convenios', {
      unidad_id: unidadId,
      cuotas,
      primera_cuota_el: primeraCuotaEl,
    });
    return data.data;
  },

  async cancelarConvenio(id: number, motivo: string): Promise<Convenio> {
    const { data } = await api.post<ApiRespuesta<Convenio>>(`/finanzas/convenios/${id}/cancelar`, {
      motivo,
    });
    return data.data;
  },
};
