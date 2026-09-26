import { api } from '@/core/api/client';
import type { ApiRespuesta } from '@/core/api/types';

export interface Bloque {
  id: number;
  nombre: string;
  orden: number;
}

export interface NuevoBloque {
  nombre: string;
  orden?: number | undefined;
}

/** El condominio va en el header X-Condominio-Id (lo agrega el cliente HTTP). */
export const bloquesService = {
  async listar(): Promise<Bloque[]> {
    const { data } = await api.get<ApiRespuesta<Bloque[]>>('/bloques');
    return data.data;
  },

  async crear(datos: NuevoBloque): Promise<Bloque> {
    const { data } = await api.post<ApiRespuesta<Bloque>>('/bloques', datos);
    return data.data;
  },
};
