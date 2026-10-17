import { api } from '@/core/api/client';
import type { ApiRespuesta } from '@/core/api/types';

/** Tipos del contrato (safic_backend/docs/openapi.yaml · GET/PUT /finanzas/configuracion). Dinero como texto decimal. */
export interface ReglasFinanzas {
  umbral_segunda_aprobacion: string;
  aprobador_puede_pagar: boolean;
  tolerancia_bancaria: string;
  /** Días después del vencimiento antes de considerar la mora. */
  dias_gracia: number;
  /** Meses de deuda vencida desde los que se restringen las áreas comunes (Decreto 462). */
  meses_restriccion: number;
  /** Días entre la notificación y la restricción. */
  dias_aviso_restriccion: number;
}

export const reglasFinanzasService = {
  async ver(): Promise<ReglasFinanzas> {
    const { data } = await api.get<ApiRespuesta<ReglasFinanzas>>('/finanzas/configuracion');
    return data.data;
  },

  async guardar(cambios: Partial<ReglasFinanzas>): Promise<ReglasFinanzas> {
    const { data } = await api.put<ApiRespuesta<ReglasFinanzas>>(
      '/finanzas/configuracion',
      cambios,
    );
    return data.data;
  },
};
