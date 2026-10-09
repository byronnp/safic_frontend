import { api } from '@/core/api/client';
import type { ApiRespuesta } from '@/core/api/types';

/** Tipos del contrato (safic_backend/docs/openapi.yaml · Usuarios · Directiva). */
export type CargoClave = 'presidente' | 'vicepresidente' | 'secretario' | 'tesorero';
export type EstadoCargo = 'vigente' | 'prorrogado' | 'vacante';

export interface TitularCargo {
  persona_id: number;
  nombre: string;
  unidad: string | null;
  /** false: vendió su unidad y ya no cumple el requisito. */
  sigue_siendo_propietario: boolean;
}

export interface CargoDirectiva {
  cargo: CargoClave;
  etiqueta: string;
  estado: EstadoCargo;
  titular: TitularCargo | null;
  /** AAAA-MM-DD */
  periodo_inicio: string | null;
  periodo_fin: string | null;
  acta: string | null;
}

export type MotivoCandidato = 'ocupa_cargo' | 'sin_correo';

export interface CandidatoDirectiva {
  persona_id: number;
  nombre: string;
  unidad: string;
  disponible: boolean;
  motivo: MotivoCandidato | null;
  cargo_actual: CargoClave | null;
}

export interface AsignarCargo {
  persona_id: number;
  acta: string;
  /** AAAA-MM-DD, después de hoy y hasta 4 años. */
  periodo_hasta: string;
}

/** El condominio va en el header X-Condominio-Id (lo agrega el cliente HTTP). */
export const directivaService = {
  async ver(): Promise<CargoDirectiva[]> {
    const { data } = await api.get<ApiRespuesta<CargoDirectiva[]>>('/directiva');
    return data.data;
  },

  async candidatos(cargo: CargoClave): Promise<CandidatoDirectiva[]> {
    const { data } = await api.get<ApiRespuesta<CandidatoDirectiva[]>>(
      `/directiva/${cargo}/candidatos`,
    );
    return data.data;
  },

  async asignar(cargo: CargoClave, datos: AsignarCargo): Promise<CargoDirectiva> {
    const { data } = await api.post<ApiRespuesta<CargoDirectiva>>(`/directiva/${cargo}`, datos);
    return data.data;
  },
};
