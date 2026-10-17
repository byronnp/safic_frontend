import { api } from '@/core/api/client';
import type { ApiRespuesta } from '@/core/api/types';

/** Tipos del contrato (safic_backend/docs/openapi.yaml · Reservas · áreas comunes). Los montos son texto decimal. */
export type EstadoArea = 'disponible' | 'mantenimiento' | 'inactiva';

export interface ReglasArea {
  /** «HH:MM» */
  abre: string;
  cierra: string;
  duracion_min_horas: number;
  duracion_max_horas: number;
  anticipacion_min_horas: number;
  anticipacion_max_dias: number;
  capacidad: number | null;
  reservas_por_unidad_mes: number | null;
  /** 1 = lunes … 7 = domingo */
  dias_semana: number[];
  costo: string;
  garantia: string;
  reglamento: string | null;
}

export interface AreaComun {
  id: number;
  nombre: string;
  ubicacion: string | null;
  estado: EstadoArea;
  requiere_aprobacion: boolean;
  restringible_por_mora: boolean;
  /** false = aún no se guardan reglas: se muestran las de por defecto. */
  configurada: boolean;
  reglas: ReglasArea;
}

export type ReglasAreaEntrada = ReglasArea & {
  requiere_aprobacion: boolean;
  restringible_por_mora: boolean;
};

export const areasService = {
  async listar(): Promise<AreaComun[]> {
    const { data } = await api.get<ApiRespuesta<AreaComun[]>>('/areas-comunes/areas');
    return data.data;
  },

  async guardarReglas(id: number, reglas: ReglasAreaEntrada): Promise<AreaComun> {
    const { data } = await api.put<ApiRespuesta<AreaComun>>(
      `/areas-comunes/areas/${id}/reglas`,
      reglas,
    );
    return data.data;
  },
};
