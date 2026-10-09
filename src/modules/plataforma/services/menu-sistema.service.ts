import { api } from '@/core/api/client';
import type { ApiRespuesta } from '@/core/api/types';

/** Tipos del contrato (safic_backend/docs/openapi.yaml · Plataforma · menú del sistema). */
export type AmbitoMenu = 'condominio' | 'plataforma';

export interface MenuSistemaItem {
  id: number;
  clave: string;
  padre_id: number | null;
  etiqueta: string;
  /** Material Symbols Rounded con prefijo: `sym_r_gavel`. */
  icono: string;
  /** Nombre de la ruta del router; los grupos no tienen. */
  ruta: string | null;
  permiso: string | null;
  es_grupo: boolean;
  seccion: boolean;
  orden: number;
  activo: boolean;
  /** Perfiles que lo ven (solo pantallas). */
  roles: string[];
}

export interface MenuSistema {
  items: MenuSistemaItem[];
  roles: { clave: string; nombre: string }[];
  permisos: { clave: string; etiqueta: string; grupo: string }[];
}

/** Ítem de la vista previa: mismo formato que GET /me/menu. */
export interface MenuVistaPreviaItem {
  id: string;
  etiqueta: string;
  icono: string;
  ruta?: string;
  hijos?: MenuVistaPreviaItem[];
  seccion?: boolean;
}

export interface MenuVistaPrevia {
  menu: MenuVistaPreviaItem[];
  ocultos: number;
}

export interface NuevoMenuItem {
  ambito: AmbitoMenu;
  padre_id?: number | null;
  etiqueta: string;
  icono: string;
  ruta?: string | null;
  permiso?: string | null;
  seccion?: boolean;
  activo?: boolean;
  roles?: string[];
}

/** Al editar solo viaja lo que cambia. */
export interface CambiosMenuItem {
  etiqueta?: string;
  icono?: string;
  ruta?: string;
  permiso?: string | null;
  activo?: boolean;
  roles?: string[];
}

const BASE = '/plataforma/menu-sistema';

/** Panel del super admin: no depende de un condominio (no lleva X-Condominio-Id). */
export const menuSistemaService = {
  async listar(ambito: AmbitoMenu): Promise<MenuSistema> {
    const { data } = await api.get<ApiRespuesta<MenuSistema>>(BASE, { params: { ambito } });
    return data.data;
  },

  async crear(datos: NuevoMenuItem): Promise<MenuSistemaItem> {
    const { data } = await api.post<ApiRespuesta<MenuSistemaItem>>(BASE, datos);
    return data.data;
  },

  async editar(id: number, cambios: CambiosMenuItem): Promise<MenuSistemaItem> {
    const { data } = await api.patch<ApiRespuesta<MenuSistemaItem>>(`${BASE}/${id}`, cambios);
    return data.data;
  },

  async mover(id: number, direccion: 'arriba' | 'abajo'): Promise<MenuSistemaItem[]> {
    const { data } = await api.post<ApiRespuesta<MenuSistemaItem[]>>(`${BASE}/${id}/mover`, {
      direccion,
    });
    return data.data;
  },

  async vistaPrevia(ambito: AmbitoMenu, perfil: string): Promise<MenuVistaPrevia> {
    const { data } = await api.get<ApiRespuesta<MenuVistaPrevia>>(`${BASE}/vista-previa`, {
      params: { ambito, perfil },
    });
    return data.data;
  },
};
