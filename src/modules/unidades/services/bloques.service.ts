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

export type CambiosBloque = Partial<NuevoBloque>;

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

  async editar(id: number, cambios: CambiosBloque): Promise<Bloque> {
    const { data } = await api.patch<ApiRespuesta<Bloque>>(`/bloques/${id}`, cambios);
    return data.data;
  },

  async eliminar(id: number): Promise<void> {
    await api.delete(`/bloques/${id}`);
  },
};
