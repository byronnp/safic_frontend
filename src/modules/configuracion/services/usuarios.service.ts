import { api } from '@/core/api/client';
import type { ApiRespuesta } from '@/core/api/types';

/** Tipos del contrato (safic_backend/docs/openapi.yaml · Usuarios). */
export type PerfilAsignable = 'administrador' | 'contador' | 'guardia' | 'mantenimiento';
export type EstadoUsuario = 'activo' | 'pendiente' | 'desactivado' | 'vencido';

export interface UsuarioCondominio {
  id: number;
  nombre: string;
  email: string;
  celular: string | null;
  /** Todos sus perfiles en el condominio (incluye cargos de directiva y residente). */
  roles: string[];
  /** El perfil que asigna la administración; null si solo tiene cargos o es residente. */
  perfil: PerfilAsignable | null;
  cuenta_cupo: boolean;
  estado: EstadoUsuario;
  /** AAAA-MM-DD */
  acceso_hasta: string | null;
  es_yo: boolean;
}

export interface CupoUsuarios {
  plan: string | null;
  /** null si el condominio no tiene plan (sin límite). */
  limite: number | null;
  usados: number;
}

export interface ListaUsuarios {
  usuarios: UsuarioCondominio[];
  cupo: CupoUsuarios;
}

export interface InvitarUsuario {
  nombre: string;
  cedula: string;
  email: string;
  celular: string | null;
  rol: PerfilAsignable;
  acceso_hasta: string | null;
}

/** Solo viaja lo que cambia. */
export interface ActualizarUsuario {
  rol?: PerfilAsignable;
  acceso_hasta?: string | null;
  activo?: boolean;
}

export type UsuarioInvitado = UsuarioCondominio & { invitacion_enviada: boolean };

/** El condominio va en el header X-Condominio-Id (lo agrega el cliente HTTP). */
export const usuariosService = {
  async listar(): Promise<ListaUsuarios> {
    const { data } = await api.get<ApiRespuesta<UsuarioCondominio[]>>('/usuarios');
    return {
      usuarios: data.data,
      cupo: (data.meta?.cupo as CupoUsuarios | undefined) ?? {
        plan: null,
        limite: null,
        usados: 0,
      },
    };
  },

  async invitar(datos: InvitarUsuario): Promise<UsuarioInvitado> {
    const { data } = await api.post<ApiRespuesta<UsuarioInvitado>>('/usuarios', datos);
    return data.data;
  },

  async actualizar(id: number, datos: ActualizarUsuario): Promise<UsuarioCondominio> {
    const { data } = await api.patch<ApiRespuesta<UsuarioCondominio>>(`/usuarios/${id}`, datos);
    return data.data;
  },

  async reenviarInvitacion(id: number): Promise<UsuarioCondominio> {
    const { data } = await api.post<ApiRespuesta<UsuarioCondominio>>(`/usuarios/${id}/invitacion`);
    return data.data;
  },
};
