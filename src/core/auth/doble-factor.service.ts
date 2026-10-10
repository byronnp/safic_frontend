import { api } from '@/core/api/client';
import type { ApiRespuesta } from '@/core/api/types';

/** Contrato: safic_backend/docs/openapi.yaml · /auth/2fa/*. */
export interface PreparacionDobleFactor {
  /** Base32, para escribirlo a mano si no se puede escanear. */
  secreto: string;
  /** otpauth://totp/… que se muestra como QR. */
  uri: string;
}

export interface CodigosRespaldo {
  /** 8 códigos de un solo uso. Solo se muestran esta vez. */
  codigos_respaldo: string[];
}

/** Verificación en dos pasos de la propia cuenta. Cada paso sensible pide la contraseña. */
export const dobleFactorService = {
  async preparar(password: string): Promise<PreparacionDobleFactor> {
    const { data } = await api.post<ApiRespuesta<PreparacionDobleFactor>>('/auth/2fa/preparar', {
      password,
    });
    return data.data;
  },

  /** Activa la verificación con un código de la app; devuelve los códigos de respaldo. */
  async confirmar(codigo: string): Promise<CodigosRespaldo> {
    const { data } = await api.post<ApiRespuesta<CodigosRespaldo>>('/auth/2fa/confirmar', {
      codigo,
    });
    return data.data;
  },

  async regenerarCodigos(password: string, codigo: string): Promise<CodigosRespaldo> {
    const { data } = await api.post<ApiRespuesta<CodigosRespaldo>>('/auth/2fa/codigos', {
      password,
      codigo,
    });
    return data.data;
  },

  async desactivar(password: string, codigo: string): Promise<void> {
    await api.post('/auth/2fa/desactivar', { password, codigo });
  },
};
