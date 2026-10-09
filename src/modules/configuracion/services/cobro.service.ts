import { api } from '@/core/api/client';
import type { ApiRespuesta } from '@/core/api/types';
import type { MetodoCobro, TipoUnidad } from '@/modules/unidades/services/unidades.service';

/** Tipos del contrato (safic_backend/docs/openapi.yaml · Finanzas · /cobro). Los montos son texto decimal. */
export interface ValorTipo {
  tipo: TipoUnidad;
  valor: string;
}

export interface CambioCobro {
  /** metodo, cuota_general, presupuesto_mensual, dia_vencimiento, aplica_desde o valor_tipo:<tipo>. */
  campo: string;
  antes: string | null;
  despues: string | null;
}

export interface RegistroHistorialCobro {
  fecha: string;
  quien: string;
  /** Es la configuración inicial (alta del condominio). */
  inicial: boolean;
  cambios: CambioCobro[];
}

export interface CobroCuotas {
  configurado: boolean;
  metodo: MetodoCobro;
  cuota_general: string | null;
  presupuesto_mensual: string | null;
  valores_tipo: ValorTipo[];
  /** 0 = último día del mes. */
  dia_vencimiento: number;
  /** AAAA-MM; null si nunca se configuró. */
  aplica_desde: string | null;
  unidades: {
    por_tipo: Record<TipoUnidad, number>;
    con_cupo: number;
    suma_cuotas: string;
    sin_alicuota: number;
    sin_cuota_mensual: number;
  };
  historial: RegistroHistorialCobro[];
}

export interface GuardarCobro {
  metodo: MetodoCobro;
  cuota_general: string | null;
  presupuesto_mensual: string | null;
  valores_tipo: ValorTipo[] | null;
  dia_vencimiento: number;
  aplica_desde: string;
}

/** El condominio va en el header X-Condominio-Id (lo agrega el cliente HTTP). */
export const cobroService = {
  async ver(): Promise<CobroCuotas> {
    const { data } = await api.get<ApiRespuesta<CobroCuotas>>('/cobro');
    return data.data;
  },

  async guardar(datos: GuardarCobro): Promise<CobroCuotas> {
    const { data } = await api.put<ApiRespuesta<CobroCuotas>>('/cobro', datos);
    return data.data;
  },
};
