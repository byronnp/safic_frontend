import { AxiosError, type AxiosResponse } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';
import { aApiError } from '@/core/api/errors';

import type { ResultadoImportacion } from '../services/unidades.service';
import { unidadesService } from '../services/unidades.service';
import {
  cantidadUnidades,
  etiquetaCampo,
  motivoSinConfirmar,
  puedeConfirmarImportacion,
} from '../unidad.importacion';

afterEach(() => {
  vi.restoreAllMocks();
});

function vista(cambios: Partial<ResultadoImportacion> = {}): ResultadoImportacion {
  return {
    confirmado: false,
    total_filas: 3,
    validas: 3,
    con_errores: 0,
    errores: [],
    bloques_nuevos: [],
    cupo: { total: 10, registradas: 2, nuevas: 3, alcanza: true },
    creadas: 0,
    ...cambios,
  };
}

describe('servicio de importación de unidades', () => {
  it('envía el archivo como formulario; confirmar solo cuando se pide', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: vista() } });
    const archivo = new File(['x'], 'unidades.xlsx');

    await unidadesService.importar(archivo, false);
    await unidadesService.importar(archivo, true);

    const [ruta, previo] = post.mock.calls[0] as [string, FormData];
    const [, confirmado] = post.mock.calls[1] as [string, FormData];
    expect(ruta).toBe('/unidades/importacion');
    expect(previo.get('archivo')).toBeInstanceOf(File);
    expect(previo.has('confirmar')).toBe(false);
    expect(confirmado.get('confirmar')).toBe('1');
  });

  it('descarga la plantilla como archivo', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: new Blob(['x']) });

    expect(await unidadesService.descargarPlantilla()).toBeInstanceOf(Blob);
    expect(get).toHaveBeenCalledWith('/unidades/importacion/plantilla', { responseType: 'blob' });
  });
});

describe('errores al descargar la plantilla', () => {
  it('conserva el código de la API aunque el cuerpo llegue como Blob', async () => {
    const cuerpo = { error: { code: 'SIN_PERMISO', message: 'No tienes permiso.' } };
    const error = new AxiosError('403', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 403,
      data: new Blob([JSON.stringify(cuerpo)]),
    } as AxiosResponse);
    vi.spyOn(api, 'get').mockRejectedValue(error);

    const capturado = await unidadesService.descargarPlantilla().catch(aApiError);

    expect(capturado).toMatchObject({ codigo: 'SIN_PERMISO', mensaje: 'No tienes permiso.' });
  });
});

describe('reglas de la vista previa', () => {
  it('solo se confirma sin errores, con filas y con cupo', () => {
    expect(puedeConfirmarImportacion(null)).toBe(false);
    expect(puedeConfirmarImportacion(vista())).toBe(true);
    expect(puedeConfirmarImportacion(vista({ con_errores: 1, validas: 2 }))).toBe(false);
    expect(puedeConfirmarImportacion(vista({ total_filas: 0, validas: 0 }))).toBe(false);
    expect(
      puedeConfirmarImportacion(
        vista({ cupo: { total: 4, registradas: 2, nuevas: 3, alcanza: false } }),
      ),
    ).toBe(false);
  });

  it('explica por qué no se puede confirmar', () => {
    expect(motivoSinConfirmar(vista())).toBeNull();
    expect(motivoSinConfirmar(vista({ total_filas: 0, validas: 0 }))).toContain(
      'no tiene unidades',
    );
    expect(motivoSinConfirmar(vista({ con_errores: 2 }))).toContain('Corrige');
    expect(
      motivoSinConfirmar(vista({ cupo: { total: 4, registradas: 2, nuevas: 3, alcanza: false } })),
    ).toBe(
      'Solo quedan 2 unidades por registrar de 4 contratadas y el archivo trae 3. Solicita un aumento o reduce el archivo.',
    );
  });

  it('nombra los campos como la plantilla y pluraliza', () => {
    expect(etiquetaCampo('area_m2')).toBe('Área (m²)');
    expect(etiquetaCampo('otro')).toBe('otro');
    expect(cantidadUnidades(1)).toBe('1 unidad');
    expect(cantidadUnidades(12)).toBe('12 unidades');
  });
});
