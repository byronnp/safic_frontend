import { api } from '@/core/api/client';
import type { ApiRespuesta } from '@/core/api/types';

/** Tipos del contrato (safic_backend/docs/openapi.yaml · Finanzas · gastos). Los montos son texto decimal. */
export type EstadoGasto = 'por_aprobar' | 'aprobada' | 'rechazada' | 'pagada';
export type FiltroGastos = 'todas' | 'por_aprobar' | 'por_pagar' | 'pagadas' | 'rechazadas';

export interface Gasto {
  id: number;
  proveedor: { id: number; razon_social: string; ruc: string };
  numero: string;
  categoria: string | null;
  descripcion: string | null;
  origen: 'xml' | 'manual';
  fecha_emision: string;
  vence_el: string;
  subtotal: string;
  iva: string;
  total: string;
  pagado: string;
  saldo: string;
  estado: EstadoGasto;
  /** Aprobada con abonos y saldo pendiente. */
  pagada_parcial: boolean;
  requiere_segunda_aprobacion: boolean;
  /** Qué aprobación falta; null si ya no espera ninguna. */
  nivel_pendiente: 1 | 2 | null;
  motivo_rechazo: string | null;
  vencida: boolean;
  tiene_xml: boolean;
  tiene_pdf: boolean;
}

export interface Aprobacion {
  nivel: 1 | 2;
  decision: 'aprobada' | 'rechazada';
  por: string | null;
  comentario: string | null;
  en_subrogacion: boolean;
  en: string | null;
}

export interface GastoDetalle extends Gasto {
  registrada_por: string | null;
  /** La registró quien consulta: no puede aprobarla ni rechazarla. */
  registrada_por_mi: boolean;
  registrada_en: string | null;
  aprobaciones: Aprobacion[];
}

export interface ResumenGastos {
  por_aprobar_monto: string;
  por_aprobar_facturas: number;
  por_pagar_monto: string;
  por_pagar_facturas: number;
  vencido_monto: string;
  vencido_facturas: number;
}

export interface ListaGastos {
  gastos: Gasto[];
  resumen: ResumenGastos;
  conteos: Record<FiltroGastos, number>;
}

export interface FacturaManual {
  proveedor_id: number;
  numero: string;
  fecha_emision: string;
  vence_el: string | null;
  subtotal: string;
  con_iva: boolean;
  categoria: string | null;
  descripcion: string | null;
}

export interface FacturaXml {
  xml: File;
  pdf: File | null;
  vence_el: string | null;
}

export const gastosService = {
  async listar(filtro: FiltroGastos, buscar: string): Promise<ListaGastos> {
    const { data } = await api.get<ApiRespuesta<Gasto[]>>('/gastos', {
      params: { filtro, ...(buscar.trim() !== '' ? { buscar: buscar.trim() } : {}) },
    });
    const meta = data.meta as
      { resumen?: ResumenGastos; conteos?: Record<FiltroGastos, number> } | undefined;
    if (!meta?.resumen || !meta.conteos) {
      throw new Error('Respuesta de cuentas por pagar incompleta.');
    }
    return { gastos: data.data, resumen: meta.resumen, conteos: meta.conteos };
  },

  async registrar(datos: FacturaManual): Promise<Gasto> {
    const { data } = await api.post<ApiRespuesta<Gasto>>('/gastos', datos);
    return data.data;
  },

  async importarXml(datos: FacturaXml): Promise<Gasto> {
    const formulario = new FormData();
    formulario.append('xml', datos.xml);
    if (datos.pdf) formulario.append('pdf', datos.pdf);
    if (datos.vence_el) formulario.append('vence_el', datos.vence_el);
    const { data } = await api.post<ApiRespuesta<Gasto>>('/gastos/importar-xml', formulario);
    return data.data;
  },

  async ver(id: number): Promise<GastoDetalle> {
    const { data } = await api.get<ApiRespuesta<GastoDetalle>>(`/gastos/${id}`);
    return data.data;
  },

  async aprobar(id: number, comentario: string | null): Promise<GastoDetalle> {
    const { data } = await api.post<ApiRespuesta<GastoDetalle>>(`/gastos/${id}/aprobar`, {
      comentario,
    });
    return data.data;
  },

  async rechazar(id: number, motivo: string): Promise<GastoDetalle> {
    const { data } = await api.post<ApiRespuesta<GastoDetalle>>(`/gastos/${id}/rechazar`, {
      motivo,
    });
    return data.data;
  },
};
