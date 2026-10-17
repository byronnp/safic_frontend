import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import {
  gastoCajaVacio,
  porcentajeGastado,
  validarFondo,
  validarGastoCaja,
} from '../caja-chica.logica';
import { clavesCajaChica } from '../composables/useCajaChica';
import { cajaChicaService } from '../services/caja-chica.service';

afterEach(() => vi.restoreAllMocks());

const foto = (tipo = 'image/jpeg', bytes = 1000) =>
  new File([new Uint8Array(bytes)], 'recibo', { type: tipo });
const valido = () => ({
  ...gastoCajaVacio('2026-10-17'),
  concepto: 'Focos y cinta',
  monto: '35,50',
  respaldo: foto(),
});

describe('caja chica', () => {
  it('las claves de caché incluyen el condominio', () => {
    expect(clavesCajaChica.estado(7)).toEqual(['finanzas', 7, 'caja-chica']);
    expect(clavesCajaChica.estado(7)).not.toEqual(clavesCajaChica.estado(8));
  });

  it('un gasto válido no tiene errores', () => {
    expect(validarGastoCaja(valido(), '2026-10-17', '100.00')).toEqual({});
  });

  it('exige la foto del respaldo, su tipo y su tamaño', () => {
    expect(validarGastoCaja({ ...valido(), respaldo: null }, '2026-10-17', '100.00').respaldo).toBe(
      'La foto del respaldo es obligatoria.',
    );
    expect(
      validarGastoCaja({ ...valido(), respaldo: foto('text/plain') }, '2026-10-17', '100.00')
        .respaldo,
    ).toContain('JPG o PNG');
    expect(
      validarGastoCaja(
        { ...valido(), respaldo: foto('image/png', 6 * 1024 * 1024) },
        '2026-10-17',
        '100.00',
      ).respaldo,
    ).toContain('5 MB');
  });

  it('no deja gastar más de lo disponible ni fechas futuras', () => {
    expect(
      validarGastoCaja({ ...valido(), monto: '100.01' }, '2026-10-17', '100.00').monto,
    ).toContain('Supera lo disponible');
    expect(
      validarGastoCaja({ ...valido(), fecha: '2026-10-18' }, '2026-10-17', '100.00').fecha,
    ).toBe('La fecha no puede ser futura.');
    expect(validarGastoCaja({ ...valido(), monto: '0' }, '2026-10-17', '100.00').monto).toBe(
      'El monto debe ser mayor a cero.',
    );
  });

  it('el fondo no puede quedar por debajo de lo gastado', () => {
    expect(validarFondo({ fondo: '200', responsable: 'Marco Salas' }, '50.00')).toEqual({});
    expect(validarFondo({ fondo: '40', responsable: 'Marco Salas' }, '50.00').fondo).toContain(
      'menor a lo ya gastado',
    );
    expect(validarFondo({ fondo: '200', responsable: 'Ma' }, '0.00').responsable).toBeDefined();
  });

  it('calcula el porcentaje gastado del fondo', () => {
    expect(porcentajeGastado('200.00', '50.00')).toBe(25);
    expect(porcentajeGastado('0.00', '10.00')).toBe(0);
    expect(porcentajeGastado('100.00', '150.00')).toBe(100);
  });

  it('el servicio llama a las rutas del contrato y envía el respaldo como formulario', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: { fondo: '200.00' } } });
    const put = vi.spyOn(api, 'put').mockResolvedValue({ data: { data: {} } });
    const post = vi
      .spyOn(api, 'post')
      .mockResolvedValueOnce({ data: { data: {} } })
      .mockResolvedValueOnce({
        data: { data: { ultima_reposicion: null }, meta: { gasto_numero: 'CC-2026-001' } },
      });

    expect((await cajaChicaService.ver()).fondo).toBe('200.00');
    expect(get).toHaveBeenCalledWith('/finanzas/caja-chica');

    await cajaChicaService.guardar({ fondo: '200.00', responsable_nombre: 'Marco Salas' });
    expect(put).toHaveBeenCalledWith('/finanzas/caja-chica', {
      fondo: '200.00',
      responsable_nombre: 'Marco Salas',
    });

    await cajaChicaService.registrar({
      concepto: 'Focos',
      comercio: null,
      monto: '10.00',
      fecha: '2026-10-17',
      respaldo: foto(),
    });
    const [ruta, formulario] = post.mock.calls[0] as [string, FormData];
    expect(ruta).toBe('/finanzas/caja-chica/movimientos');
    expect(formulario.get('concepto')).toBe('Focos');
    expect(formulario.get('respaldo')).toBeInstanceOf(File);
    expect(formulario.has('comercio')).toBe(false);

    expect(await cajaChicaService.reponer()).toEqual({ gastoNumero: 'CC-2026-001' });
    expect(post.mock.calls[1]?.[0]).toBe('/finanzas/caja-chica/reponer');
  });
});
