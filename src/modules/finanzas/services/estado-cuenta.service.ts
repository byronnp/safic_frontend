import { api } from '@/core/api/client';
import { pedirArchivo } from '@/core/api/descarga';
import type { ApiRespuesta } from '@/core/api/types';

/** Tipos del contrato (safic_backend/docs/openapi.yaml · Finanzas · estado de cuenta). Los montos son texto decimal. */
export interface MovimientoCuenta {
  fecha: string;
  concepto: string;
  cargo: string | null;
  abono: string | null;
  /** Negativo = a favor. */
  saldo: string;
}

export interface EstadoCuenta {
  unidad: { id: number; codigo: string; tipo: string; ubicacion: string };
  responsable: { nombre: string; relacion: string } | null;
  saldo_pendiente: string;
  saldo_favor: string;
  dias_atraso: number;
  proximo_vencimiento: string | null;
  pagado_en_el_anio: { monto: string; pagos: number; anio: number };
  saldo_inicial: string;
  movimientos: MovimientoCuenta[];
}

export interface RangoCuenta {
  desde?: string;
  hasta?: string;
}

export interface PagoEfectivoRegistrado {
  pago_id: number;
  monto: string;
  recibo: string;
}

function parametros(rango: RangoCuenta): Record<string, string> {
  return {
    ...(rango.desde ? { desde: rango.desde } : {}),
    ...(rango.hasta ? { hasta: rango.hasta } : {}),
  };
}

export const estadoCuentaService = {
  async ver(unidadId: number, rango: RangoCuenta): Promise<EstadoCuenta> {
    const { data } = await api.get<ApiRespuesta<EstadoCuenta>>(
      `/unidades/${unidadId}/estado-cuenta`,
      {
        params: parametros(rango),
      },
    );
    return data.data;
  },

  pdf(unidadId: number, rango: RangoCuenta): Promise<Blob> {
    const consulta = new URLSearchParams(parametros(rango)).toString();
    return pedirArchivo(`/unidades/${unidadId}/estado-cuenta/pdf${consulta ? `?${consulta}` : ''}`);
  },

  async registrarEfectivo(unidadId: number, monto: string): Promise<PagoEfectivoRegistrado> {
    const { data } = await api.post<ApiRespuesta<PagoEfectivoRegistrado>>(
      `/unidades/${unidadId}/pagos-efectivo`,
      { monto },
    );
    return data.data;
  },
};
