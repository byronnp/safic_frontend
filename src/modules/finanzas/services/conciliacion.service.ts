import { api } from '@/core/api/client';
import type { ApiRespuesta } from '@/core/api/types';

/** Tipos del contrato (safic_backend/docs/openapi.yaml · Finanzas · conciliación). Los montos son texto decimal con signo. */
export type EstadoLinea = 'automatico' | 'sugerido' | 'sin_identificar' | 'conciliado';
export type TipoLinea = 'pago_residente' | 'pago_proveedor' | 'interes' | 'comision' | 'otro';
export type TipoManual = 'interes' | 'comision' | 'otro';

export interface LineaBanco {
  id: number;
  fecha: string;
  descripcion: string;
  referencia: string | null;
  /** Crédito (+) o débito (−). */
  monto: string;
  estado: EstadoLinea;
  tipo: TipoLinea | null;
  pago_id: number | null;
  pago_proveedor_id: number | null;
  propuesta: { tipo: string; id: number | null; texto: string | null } | null;
}

export interface EstadoCuentaBanco {
  id: number;
  cuenta_bancaria_id: number;
  /** "Banco Pichincha · Corriente ····4821" */
  cuenta: string;
  periodo: string;
  archivo_nombre: string;
  movimientos: number;
  duplicados: number;
  pendientes: number;
  conteos: { automaticos: number; sugeridos: number; sin_identificar: number };
}

export interface Cuadre {
  saldo_inicial: string | null;
  pagos_residentes: string;
  intereses: string;
  gastos_pagados: string;
  comisiones: string;
  otros: string;
  ajustes: string;
  saldo_app: string | null;
  saldo_banco: string | null;
  diferencia: string | null;
  archivo_cuadra: boolean | null;
}

export interface Conciliacion extends EstadoCuentaBanco {
  automaticos: LineaBanco[];
  sugeridos: LineaBanco[];
  sin_identificar: LineaBanco[];
  cuadre: Cuadre;
}

export interface ImportarEstado {
  cuentaBancariaId: number;
  periodo: string;
  archivo: File;
  saldoInicial: string | null;
  saldoFinal: string | null;
}

export interface ResultadoImportacion {
  conciliacion: Conciliacion;
  nuevos: number;
  duplicados: number;
  fueraDelMes: number;
}

export const conciliacionService = {
  async estados(periodo: string): Promise<EstadoCuentaBanco[]> {
    const { data } = await api.get<ApiRespuesta<EstadoCuentaBanco[]>>('/conciliacion/estados', {
      params: { periodo },
    });
    return data.data;
  },

  async ver(id: number): Promise<Conciliacion> {
    const { data } = await api.get<ApiRespuesta<Conciliacion>>(`/conciliacion/estados/${id}`);
    return data.data;
  },

  async importar(d: ImportarEstado): Promise<ResultadoImportacion> {
    const formulario = new FormData();
    formulario.append('cuenta_bancaria_id', String(d.cuentaBancariaId));
    formulario.append('periodo', d.periodo);
    formulario.append('archivo', d.archivo);
    if (d.saldoInicial) formulario.append('saldo_inicial', d.saldoInicial);
    if (d.saldoFinal) formulario.append('saldo_final', d.saldoFinal);
    const { data } = await api.post<
      ApiRespuesta<Conciliacion> & {
        meta: { nuevos: number; duplicados: number; fuera_del_mes: number };
      }
    >('/conciliacion/estados', formulario);
    return {
      conciliacion: data.data,
      nuevos: data.meta.nuevos,
      duplicados: data.meta.duplicados,
      fueraDelMes: data.meta.fuera_del_mes,
    };
  },

  async vincular(
    movimientoId: number,
    tipo: 'pago_residente' | 'pago_proveedor',
    pagoId: number,
  ): Promise<Conciliacion> {
    const { data } = await api.post<ApiRespuesta<Conciliacion>>(
      `/conciliacion/movimientos/${movimientoId}/vincular`,
      { tipo, pago_id: pagoId },
    );
    return data.data;
  },

  async clasificar(
    movimientoId: number,
    tipo: TipoManual,
    guardarRegla: boolean,
  ): Promise<Conciliacion> {
    const { data } = await api.post<ApiRespuesta<Conciliacion>>(
      `/conciliacion/movimientos/${movimientoId}/clasificar`,
      { tipo, guardar_regla: guardarRegla },
    );
    return data.data;
  },

  async deshacer(movimientoId: number): Promise<Conciliacion> {
    const { data } = await api.post<ApiRespuesta<Conciliacion>>(
      `/conciliacion/movimientos/${movimientoId}/deshacer`,
    );
    return data.data;
  },

  async ajustar(estadoId: number, monto: string, motivo: string): Promise<Conciliacion> {
    const { data } = await api.post<ApiRespuesta<Conciliacion>>(
      `/conciliacion/estados/${estadoId}/ajustes`,
      { monto, motivo },
    );
    return data.data;
  },
};
