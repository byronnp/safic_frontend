import { api } from '@/core/api/client';
import type { ApiRespuesta } from '@/core/api/types';

/** Tipos del contrato (safic_backend/docs/openapi.yaml · Finanzas · pagos-proveedor). Los montos son texto decimal. */
export interface PagoProveedor {
  id: number;
  /** "PP-0087" */
  codigo: string;
  proveedor: { id: number; razon_social: string; ruc: string };
  monto: string;
  fecha_pago: string;
  referencia: string;
  estado: 'registrado' | 'anulado';
  motivo_anulacion: string | null;
  tiene_comprobante: boolean;
  facturas: { gasto_id: number; numero: string; monto: string }[];
}

export interface NuevoPagoProveedor {
  proveedor_id: number;
  facturas: number[];
  monto: string;
  cuenta_bancaria_id: number;
  fecha_pago: string;
  referencia: string;
  comprobante: File | null;
}

export const pagosProveedorService = {
  async registrar(datos: NuevoPagoProveedor): Promise<PagoProveedor> {
    const formulario = new FormData();
    formulario.append('proveedor_id', String(datos.proveedor_id));
    datos.facturas.forEach((id) => formulario.append('facturas[]', String(id)));
    formulario.append('monto', datos.monto);
    formulario.append('cuenta_bancaria_id', String(datos.cuenta_bancaria_id));
    formulario.append('fecha_pago', datos.fecha_pago);
    formulario.append('referencia', datos.referencia);
    if (datos.comprobante) formulario.append('comprobante', datos.comprobante);
    const { data } = await api.post<ApiRespuesta<PagoProveedor>>('/pagos-proveedor', formulario);
    return data.data;
  },

  async anular(id: number, motivo: string): Promise<PagoProveedor> {
    const { data } = await api.post<ApiRespuesta<PagoProveedor>>(`/pagos-proveedor/${id}/anular`, {
      motivo,
    });
    return data.data;
  },
};
