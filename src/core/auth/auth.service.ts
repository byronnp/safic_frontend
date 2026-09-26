import { api } from '@/core/api/client';
import type { ApiRespuesta, ContextoCondominio, RespuestaToken, Usuario } from '@/core/api/types';

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
};
