import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

import { aApiError } from './errors';

declare module 'axios' {
  interface AxiosRequestConfig {
    /** No intentar renovar el token si la respuesta es 401 (login, refresh, logout). */
    saltarRefresco?: boolean;
    /** Uso interno: la petición ya se reintentó tras renovar el token. */
    _reintentada?: boolean;
  }
}

/**
 * Cliente HTTP único de la aplicación. Siempre usa la ruta relativa /api/v1:
 * en desarrollo la reenvía el proxy de Vite y en producción el mismo dominio.
 * `withCredentials` permite enviar la cookie HttpOnly del refresh token.
 */
export const api: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  timeout: 20_000,
  headers: { Accept: 'application/json' },
});

export interface OpcionesCliente {
  /** Access token actual (vive solo en memoria). */
  obtenerToken: () => string | null;
  /** Condominio activo; se envía en X-Condominio-Id. */
  obtenerCondominioId: () => number | null;
  /** Renueva la sesión con el refresh token; devuelve el nuevo access token o null. */
  refrescar: () => Promise<string | null>;
  /** La sesión no se pudo renovar: limpiar estado e ir al login. */
  alExpirar: () => void;
}

/**
 * Instala los interceptores en `cliente`:
 * - agrega Authorization y X-Condominio-Id a cada petición;
 * - ante un 401 renueva el token UNA sola vez aunque haya varias peticiones
 *   fallando a la vez (single-flight) y las reintenta;
 * - convierte todos los errores en ApiError.
 *
 * Devuelve una función que quita los interceptores (útil en pruebas).
 */
export function configurarCliente(cliente: AxiosInstance, opciones: OpcionesCliente): () => void {
  let refrescoEnCurso: Promise<string | null> | null = null;

  const refrescarUnaVez = (): Promise<string | null> => {
    refrescoEnCurso ??= opciones
      .refrescar()
      .catch(() => null)
      .finally(() => {
        refrescoEnCurso = null;
      });
    return refrescoEnCurso;
  };

  const peticion = cliente.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = opciones.obtenerToken();
    if (token && !config.headers.has('Authorization')) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }

    const condominioId = opciones.obtenerCondominioId();
    if (condominioId !== null && !config.headers.has('X-Condominio-Id')) {
      config.headers.set('X-Condominio-Id', String(condominioId));
    }

    return config;
  });

  const respuesta = cliente.interceptors.response.use(undefined, async (error: unknown) => {
    // Con responseType blob el cuerpo del error también llega como Blob: se lee para conservar
    // el código y el mensaje de la API (descargas de PDF y Excel).
    if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
      try {
        error.response.data = JSON.parse(await error.response.data.text());
      } catch {
        // No era JSON: queda el error genérico
      }
    }

    const config = axios.isAxiosError(error) ? error.config : undefined;
    const estado = axios.isAxiosError(error) ? error.response?.status : undefined;

    if (estado === 401 && config && !config.saltarRefresco && !config._reintentada) {
      const nuevoToken = await refrescarUnaVez();

      if (nuevoToken === null) {
        opciones.alExpirar();
        throw aApiError(error);
      }

      config._reintentada = true;
      config.headers.set('Authorization', `Bearer ${nuevoToken}`);
      return cliente.request(config);
    }

    throw aApiError(error);
  });

  return () => {
    cliente.interceptors.request.eject(peticion);
    cliente.interceptors.response.eject(respuesta);
  };
}
