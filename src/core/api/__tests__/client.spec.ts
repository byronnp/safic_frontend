import axios, { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { configurarCliente, type OpcionesCliente } from '../client';
import { ApiError } from '../errors';

function respuesta(config: InternalAxiosRequestConfig, status: number, data: unknown) {
  if (status >= 400) {
    return Promise.reject(
      new AxiosError('error', String(status), config, null, {
        status,
        statusText: '',
        headers: {},
        config,
        data,
      }),
    );
  }
  return Promise.resolve({ status, statusText: 'OK', headers: {}, config, data });
}

/** Servidor falso: acepta solo el token "nuevo". */
function crearEscenario(opciones: Partial<OpcionesCliente> = {}) {
  const vistas: InternalAxiosRequestConfig[] = [];
  const adapter: AxiosAdapter = (config) => {
    vistas.push(config);
    const autorizado = config.headers.get('Authorization') === 'Bearer nuevo';
    return autorizado
      ? respuesta(config, 200, { data: { ok: true } })
      : respuesta(config, 401, { error: { code: 'NO_AUTENTICADO', message: 'Inicia sesión.' } });
  };

  const cliente = axios.create({ adapter });
  const refrescar = vi.fn(
    () => new Promise<string | null>((resolver) => setTimeout(() => resolver('nuevo'), 10)),
  );
  const alExpirar = vi.fn();

  configurarCliente(cliente, {
    obtenerToken: () => 'viejo',
    obtenerCondominioId: () => 7,
    refrescar,
    alExpirar,
    ...opciones,
  });

  return { cliente, vistas, refrescar, alExpirar };
}

describe('cliente HTTP', () => {
  it('envía el token y el condominio activo en cada petición', async () => {
    const { cliente, vistas } = crearEscenario({ obtenerToken: () => 'nuevo' });
    await cliente.get('/bloques');
    expect(vistas[0]?.headers.get('Authorization')).toBe('Bearer nuevo');
    expect(vistas[0]?.headers.get('X-Condominio-Id')).toBe('7');
  });

  it('ante varios 401 simultáneos renueva el token UNA sola vez y reintenta', async () => {
    const { cliente, refrescar } = crearEscenario();

    const resultados = await Promise.all([cliente.get('/a'), cliente.get('/b'), cliente.get('/c')]);

    expect(refrescar).toHaveBeenCalledTimes(1);
    expect(resultados.every((r) => r.status === 200)).toBe(true);
  });

  it('si la renovación falla, cierra la sesión y devuelve ApiError', async () => {
    const { cliente, alExpirar } = crearEscenario({ refrescar: () => Promise.resolve(null) });

    const error: unknown = await cliente.get('/a').catch((e: unknown) => e);

    expect(alExpirar).toHaveBeenCalledOnce();
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).codigo).toBe('NO_AUTENTICADO');
  });

  it('no intenta renovar en peticiones marcadas con saltarRefresco (login)', async () => {
    const { cliente, refrescar } = crearEscenario();
    await expect(cliente.post('/auth/login', {}, { saltarRefresco: true })).rejects.toBeInstanceOf(
      ApiError,
    );
    expect(refrescar).not.toHaveBeenCalled();
  });

  it('normaliza los errores de validación con sus campos', async () => {
    const cliente = axios.create({
      adapter: (config) =>
        respuesta(config, 422, {
          error: {
            code: 'VALIDACION',
            message: 'Revisa los datos.',
            fields: { nombre: ['Ya existe un bloque con ese nombre.'] },
          },
        }),
    });
    configurarCliente(cliente, {
      obtenerToken: () => null,
      obtenerCondominioId: () => null,
      refrescar: () => Promise.resolve(null),
      alExpirar: () => undefined,
    });

    const error = (await cliente.post('/bloques').catch((e: unknown) => e)) as ApiError;
    expect(error.estado).toBe(422);
    expect(error.campo('nombre')).toBe('Ya existe un bloque con ese nombre.');
  });
});
