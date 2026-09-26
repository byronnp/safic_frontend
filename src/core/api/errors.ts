import { isAxiosError } from 'axios';

import type { ApiErrorCuerpo } from './types';

/**
 * Error normalizado de la API. Los componentes usan `codigo` (estable, en
 * MAYÚSCULAS) para decidir qué hacer y `mensaje` (en español) para mostrarlo.
 */
export class ApiError extends Error {
  constructor(
    readonly codigo: string,
    readonly mensaje: string,
    readonly estado: number,
    readonly campos: Record<string, string[]> = {},
  ) {
    super(mensaje);
    this.name = 'ApiError';
  }

  /** Primer mensaje de validación de un campo, para mostrarlo bajo el input. */
  campo(nombre: string): string | undefined {
    return this.campos[nombre]?.[0];
  }
}

const MENSAJES_RED: Record<string, string> = {
  SIN_CONEXION: 'No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.',
  ERROR_INESPERADO: 'Ocurrió un error inesperado. Intenta de nuevo.',
};

function esCuerpoDeError(valor: unknown): valor is ApiErrorCuerpo {
  if (typeof valor !== 'object' || valor === null || !('error' in valor)) {
    return false;
  }
  const error = valor.error;
  return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
}

/** Convierte cualquier error (axios, red, código) en un ApiError. */
export function aApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (isAxiosError(error)) {
    const cuerpo: unknown = error.response?.data;

    if (esCuerpoDeError(cuerpo)) {
      return new ApiError(
        cuerpo.error.code,
        cuerpo.error.message,
        error.response?.status ?? 0,
        cuerpo.error.fields ?? {},
      );
    }

    if (!error.response) {
      return new ApiError('SIN_CONEXION', MENSAJES_RED.SIN_CONEXION!, 0);
    }

    return new ApiError('ERROR_INESPERADO', MENSAJES_RED.ERROR_INESPERADO!, error.response.status);
  }

  return new ApiError('ERROR_INESPERADO', MENSAJES_RED.ERROR_INESPERADO!, 0);
}
