import { api } from '@/core/api/client';
import type { ApiRespuesta } from '@/core/api/types';

/** Tipos del contrato (safic_backend/docs/openapi.yaml · Finanzas · caja chica). Los montos son texto decimal. */
export interface MovimientoCajaChica {
  id: number;
  fecha: string;
  concepto: string;
  comercio: string | null;
  monto: string;
  /** Enlace temporal al respaldo; null si el archivo ya no está. */
  respaldo_url: string | null;
}

export interface CajaChica {
  configurada: boolean;
  fondo: string;
  responsable: string | null;
  gastado: string;
  disponible: string;
  movimientos: MovimientoCajaChica[];
  ultima_reposicion: {
    fecha: string;
    gasto_id: number;
    gasto_numero: string;
    monto: string;
    estado: string;
  } | null;
}

export interface NuevoMovimientoCajaChica {
  concepto: string;
  comercio: string | null;
  monto: string;
  fecha: string;
  respaldo: File;
}

export interface ConfiguracionCajaChica {
  fondo: string;
  responsable_nombre: string;
}

export const cajaChicaService = {
  async ver(): Promise<CajaChica> {
    const { data } = await api.get<ApiRespuesta<CajaChica>>('/finanzas/caja-chica');
    return data.data;
  },

  async guardar(datos: ConfiguracionCajaChica): Promise<CajaChica> {
    const { data } = await api.put<ApiRespuesta<CajaChica>>('/finanzas/caja-chica', datos);
    return data.data;
  },

  async registrar(datos: NuevoMovimientoCajaChica): Promise<CajaChica> {
    const formulario = new FormData();
    formulario.append('concepto', datos.concepto);
    if (datos.comercio) formulario.append('comercio', datos.comercio);
    formulario.append('monto', datos.monto);
    formulario.append('fecha', datos.fecha);
    formulario.append('respaldo', datos.respaldo);
    const { data } = await api.post<ApiRespuesta<CajaChica>>(
      '/finanzas/caja-chica/movimientos',
      formulario,
    );
    return data.data;
  },

  async reponer(): Promise<{ gastoNumero: string }> {
    const { data } = await api.post<ApiRespuesta<CajaChica>>('/finanzas/caja-chica/reponer');
    const numero = (data.meta as { gasto_numero?: string } | undefined)?.gasto_numero;
    return { gastoNumero: numero ?? data.data.ultima_reposicion?.gasto_numero ?? '' };
  },
};
