import { api } from '@/core/api/client';
import type { ApiRespuesta } from '@/core/api/types';

import type { ItemMenu } from './menu';

/**
 * Menú del perfil del usuario, ya filtrado por la API (perfil + permisos).
 * Contrato: GET /me/menu (condominio del header) y GET /plataforma/me/menu.
 */
export const menuService = {
  async condominio(): Promise<ItemMenu[]> {
    const { data } = await api.get<ApiRespuesta<ItemMenu[]>>('/me/menu');
    return data.data;
  },

  async plataforma(): Promise<ItemMenu[]> {
    const { data } = await api.get<ApiRespuesta<ItemMenu[]>>('/plataforma/me/menu');
    return data.data;
  },
};
