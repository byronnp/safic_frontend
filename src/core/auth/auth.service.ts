import { api } from '@/core/api/client';
import type { ApiRespuesta, ContextoCondominio, RespuestaToken, Usuario } from '@/core/api/types';

/** Contrato: components/schemas/Invitacion. */
export interface Invitacion {
  nombre: string;
  email: string;
  condominio: string;
  expira_en: string;
  /** Versión del aviso de privacidad que se acepta al crear la contraseña. */
  aviso_privacidad_version: string;
}

/**
 * Llamadas de autenticación. El refresh token viaja en la cookie HttpOnly
 * `safic_refresh` (el navegador la maneja; JavaScript nunca la ve).
 */
export const authService = {
  async login(email: string, password: string): Promise<RespuestaToken> {
    const { data } = await api.post<ApiRespuesta<RespuestaToken>>(
      '/auth/login',
      { email, password },
      { saltarRefresco: true },
    );
    return data.data;
  },

  async refrescar(): Promise<RespuestaToken> {
    const { data } = await api.post<ApiRespuesta<RespuestaToken>>('/auth/refresh', null, {
      saltarRefresco: true,
    });
    return data.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout', null, { saltarRefresco: true });
  },

  async me(): Promise<Usuario> {
    const { data } = await api.get<ApiRespuesta<Usuario>>('/auth/me');
    return data.data;
  },

  /** Roles y permisos en un condominio (se envía el header explícito). */
  async contexto(condominioId: number): Promise<ContextoCondominio> {
    const { data } = await api.get<ApiRespuesta<ContextoCondominio>>('/me/contexto', {
      headers: { 'X-Condominio-Id': String(condominioId) },
    });
    return data.data;
  },

  /** Primer ingreso: a quién corresponde el enlace del correo (sin sesión). */
  async verInvitacion(token: string): Promise<Invitacion> {
    const { data } = await api.get<ApiRespuesta<Invitacion>>(
      `/auth/invitaciones/${encodeURIComponent(token)}`,
      { saltarRefresco: true },
    );
    return data.data;
  },

  /** Crea la contraseña y activa la cuenta. Devuelve el correo para iniciar sesión. */
  async aceptarInvitacion(
    token: string,
    password: string,
    confirmacion: string,
    aceptaPrivacidad: boolean,
    /** Versión del aviso que la persona leyó (la API rechaza si ya no es la vigente). */
    avisoVersion: string,
  ): Promise<string> {
    const { data } = await api.post<ApiRespuesta<{ email: string }>>(
      `/auth/invitaciones/${encodeURIComponent(token)}/aceptar`,
      {
        password,
        password_confirmation: confirmacion,
        acepta_privacidad: aceptaPrivacidad,
        aviso_privacidad_version: avisoVersion,
      },
      { saltarRefresco: true },
    );
    return data.data.email;
  },
};
