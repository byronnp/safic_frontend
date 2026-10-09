import { api } from '@/core/api/client';
import type { ApiRespuesta } from '@/core/api/types';

/** Tipos del contrato (safic_backend/docs/openapi.yaml · Plataforma · roles y permisos). */
export type TipoRolAdmin = 'sistema' | 'cargo' | 'adicional';

export interface RolAdmin {
  clave: string;
  nombre: string;
  tipo: TipoRolAdmin;
  /** En cuántos condominios tiene usuarios. */
  condominios: number;
  permisos: string[];
  /** Permiso → motivo por el que este rol nunca lo recibe (regla fija del código). */
  bloqueos: Record<string, string>;
  /** Permisos que no se le pueden quitar. */
  obligatorios: string[];
}

export interface PermisoAdmin {
  clave: string;
  etiqueta: string;
  grupo: string;
  /** Cuenta para el límite de usuarios administrativos del plan. */
  administrativo: boolean;
  escritura: boolean;
}

export interface SolicitudRolPendiente {
  id: number;
  condominio_id: number;
  condominio: string;
  nombre: string;
  descripcion: string;
  creada: string | null;
}

export interface RolesAdmin {
  roles: RolAdmin[];
  permisos: PermisoAdmin[];
  solicitudes: SolicitudRolPendiente[];
}

const BASE = '/plataforma/roles';

/** Panel del super admin: no depende de un condominio (no lleva X-Condominio-Id). */
export const rolesAdminService = {
  async listar(): Promise<RolesAdmin> {
    const { data } = await api.get<ApiRespuesta<RolesAdmin>>(BASE);
    return data.data;
  },

  async crear(nombre: string, permisos: string[] = []): Promise<RolAdmin> {
    const { data } = await api.post<ApiRespuesta<RolAdmin>>(BASE, { nombre, permisos });
    return data.data;
  },

  /** Reemplaza el conjunto de permisos del rol. */
  async guardarPermisos(clave: string, permisos: string[]): Promise<RolAdmin> {
    const { data } = await api.put<ApiRespuesta<RolAdmin>>(
      `${BASE}/${encodeURIComponent(clave)}/permisos`,
      {
        permisos,
      },
    );
    return data.data;
  },
};
