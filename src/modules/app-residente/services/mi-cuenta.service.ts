import { api } from '@/core/api/client';
import type { ApiRespuesta } from '@/core/api/types';

/** Tipos del contrato (safic_backend/docs/openapi.yaml · Finanzas · /mi-cuenta). Los montos son texto decimal. */
export type EstadoCuotaCuenta = 'pendiente' | 'vencida' | 'en_revision';
export type EstadoPagoCuenta = 'pendiente' | 'aprobado' | 'rechazado' | 'anulado';

export interface CuotaCuenta {
  id: number;
  /** `YYYY-MM`. */
  periodo: string;
  concepto: string;
  monto: string;
  saldo: string;
  /** `YYYY-MM-DD`. */
  vence_el: string;
  estado: EstadoCuotaCuenta;
}

export interface PagoCuenta {
  id: number;
  monto: string;
  estado: EstadoPagoCuenta;
  fecha: string;
  numero_comprobante: string | null;
  motivo_rechazo: string | null;
  /** Periodos `YYYY-MM` que el residente dijo pagar. */
  cuotas: string[];
}

export interface UnidadCuenta {
  unidad_id: number;
  codigo: string;
  relacion: 'propietario' | 'inquilino' | 'residente';
  /** Su relación es la que la unidad marca como responsable de pago. */
  puede_pagar: boolean;
  encabezado: string;
  /** Lo que escribe en el concepto de la transferencia. */
  concepto_transferencia: string;
  total_pendiente: string;
  vencidas: number;
  saldo_favor: string;
  cuotas: CuotaCuenta[];
  pagos: PagoCuenta[];
}

export interface CuentaBancariaPago {
  banco: string;
  tipo: string;
  numero: string;
  titular: string;
}

export interface MiCuenta {
  condominio: string;
  unidades: UnidadCuenta[];
  /** null si la administración aún no configuró la cuenta. */
  cuenta_bancaria: CuentaBancariaPago | null;
}

export interface PagoEnviado {
  pago_id: number;
  monto: string;
  estado: 'pendiente';
  cuenta: MiCuenta;
}

export interface EnviarPago {
  unidadId: number;
  cuotas: number[];
  numeroComprobante: string;
  comprobante: File;
}

/** El condominio va en el header X-Condominio-Id (lo agrega el cliente HTTP). */
export const miCuentaService = {
  async ver(): Promise<MiCuenta> {
    const { data } = await api.get<ApiRespuesta<MiCuenta>>('/mi-cuenta');
    return data.data;
  },

  async pagar(datos: EnviarPago): Promise<PagoEnviado> {
    const formulario = new FormData();
    formulario.append('unidad_id', String(datos.unidadId));
    datos.cuotas.forEach((id) => formulario.append('cuotas[]', String(id)));
    formulario.append('numero_comprobante', datos.numeroComprobante);
    formulario.append('comprobante', datos.comprobante);
    const { data } = await api.post<ApiRespuesta<PagoEnviado>>('/mi-cuenta/pagos', formulario);
    return data.data;
  },
};
