import { api } from '@/core/api/client';
import type { ApiRespuesta } from '@/core/api/types';

import type { CupoUsuarios } from './usuarios.service';

/** Tipos del contrato (safic_backend/docs/openapi.yaml · Usuarios · Roles). */
export type TipoRol = 'sistema' | 'cargo' | 'adicional';

export interface HojaMenu {
  etiqueta: string;
  /** Material Symbols Rounded con prefijo, ej. "sym_r_apartment". */
  icono: string;
}

export interface RolCondominio {
  clave: string;
  nombre: string;
  tipo: TipoRol;
  /** Quien lo tenga consume un lugar de usuarios administrativos del plan. */
  cuenta_cupo: boolean;
  /** Personas con este rol en el condominio. */
  usuarios: number;
  permisos: string[];
  menu: HojaMenu[];
}

export interface PermisoCatalogo {
  clave: string;
  etiqueta: string;
  grupo: string;
  administrativo: boolean;
}

export interface RolesCondominio {
  roles: RolCondominio[];
  permisos: PermisoCatalogo[];
  cupo: CupoUsuarios;
}

export interface SolicitarRol {
  nombre: string;
  descripcion: string;
}

/** El condominio va en el header X-Condominio-Id (lo agrega el cliente HTTP). */
export const rolesService = {
  async listar(): Promise<RolesCondominio> {
    const { data } = await api.get<ApiRespuesta<RolesCondominio>>('/roles');
    return data.data;
  },

  async solicitar(datos: SolicitarRol): Promise<{ id: number; nombre: string; estado: string }> {
    const { data } = await api.post<ApiRespuesta<{ id: number; nombre: string; estado: string }>>(
      '/roles/solicitudes',
      datos,
    );
    return data.data;
  },
};
