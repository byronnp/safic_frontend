import { api } from '@/core/api/client';
import { pedirArchivo } from '@/core/api/descarga';
import type { ApiRespuesta } from '@/core/api/types';

/** Tipos del contrato (safic_backend/docs/openapi.yaml · Finanzas · /pagos). Los montos son texto decimal. */
export type EstadoPago = 'pendiente' | 'aprobado' | 'rechazado' | 'anulado';
export type EstadoRevision = 'pendiente' | 'aprobado' | 'rechazado';

export interface PagoResumen {
  id: number;
  unidad_id: number;
  unidad: string;
  pagador: string | null;
  banco: string | null;
  metodo: 'transferencia' | 'efectivo';
  monto: string;
  fecha: string;
  numero_comprobante: string | null;
  /** Periodos `YYYY-MM` que el residente dijo pagar. */
  cuotas: string[];
  estado: EstadoPago;
  motivo_rechazo: string | null;
  /** Número del recibo (`000358`) cuando está aprobado. */
  recibo: string | null;
  /** Solo en pendientes. */
  validacion: { nivel: 'ok' | 'error'; texto: string } | null;
}

export interface ListaPagos {
  pagos: PagoResumen[];
  conteos: Record<EstadoRevision, number>;
  /** Tolerancia bancaria vigente. */
  tolerancia: string;
}

export interface ValidacionPago {
  clave: 'cuotas_vigentes' | 'monto_cubre' | 'comprobante_unico' | 'fecha_valida';
  ok: boolean;
  texto: string;
}

export interface PagoDetalle {
  id: number;
  unidad_id: number;
  unidad: string;
  pagador: string | null;
  metodo: string;
  monto: string;
  diferencia: string;
  fecha: string;
  numero_comprobante: string | null;
  banco_origen: string | null;
  cuenta_destino: string | null;
  estado: EstadoPago;
  motivo_rechazo: string | null;
  recibo: string | null;
  /** Enlace temporal (10 minutos): no se guarda. */
  comprobante_url: string | null;
  comprobante_tipo: string | null;
  tolerancia: string;
  cuotas: { cuota_id: number; periodo: string; monto: string }[];
  validaciones: ValidacionPago[];
  /** Qué pasaría al aprobarlo con lo declarado (solo pendientes). */
  aplicacion: {
    cuotas_completas: number;
    ajuste: string;
    a_saldo_favor: string;
    credito_previo: string;
  } | null;
}

export interface ResultadoLote {
  id: number;
  ok: boolean;
  codigo: string | null;
  mensaje: string | null;
}

export interface RespuestaLote {
  resultados: ResultadoLote[];
  aprobados: number;
  omitidos: number;
}

/** El condominio va en el header X-Condominio-Id (lo agrega el cliente HTTP). */
export const pagosService = {
  async listar(estado: EstadoRevision): Promise<ListaPagos> {
    const { data } = await api.get<ApiRespuesta<PagoResumen[]>>('/pagos', { params: { estado } });
    return {
      pagos: data.data,
      conteos: (data.meta?.conteos as Record<EstadoRevision, number> | undefined) ?? {
        pendiente: 0,
        aprobado: 0,
        rechazado: 0,
      },
      tolerancia: (data.meta?.tolerancia as string | undefined) ?? '0.50',
    };
  },

  async ver(id: number): Promise<PagoDetalle> {
    const { data } = await api.get<ApiRespuesta<PagoDetalle>>(`/pagos/${id}`);
    return data.data;
  },

  /** Sin `montoRecibido` se aprueba con lo declarado. */
  async aprobar(id: number, montoRecibido?: string): Promise<PagoDetalle> {
    const { data } = await api.post<ApiRespuesta<PagoDetalle>>(
      `/pagos/${id}/aprobar`,
      montoRecibido === undefined ? {} : { monto_recibido: montoRecibido },
    );
    return data.data;
  },

  async rechazar(id: number, motivo: string): Promise<PagoDetalle> {
    const { data } = await api.post<ApiRespuesta<PagoDetalle>>(`/pagos/${id}/rechazar`, {
      motivo,
    });
    return data.data;
  },

  async aprobarLote(ids: number[]): Promise<RespuestaLote> {
    const { data } = await api.post<ApiRespuesta<ResultadoLote[]>>('/pagos/aprobar-lote', {
      ids,
    });
    return {
      resultados: data.data,
      aprobados: Number(data.meta?.aprobados ?? 0),
      omitidos: Number(data.meta?.omitidos ?? 0),
    };
  },

  /** Recibo en PDF de un pago aprobado. */
  recibo(id: number): Promise<Blob> {
    return pedirArchivo(`/pagos/${id}/recibo`);
  },
};
