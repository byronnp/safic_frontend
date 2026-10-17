import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import { clavesPaquetes } from '../composables/usePaquetes';
import {
  detallePaquete,
  haceDias,
  paqueteVacio,
  tituloMiPaquete,
  validarPaquete,
  validarRetira,
} from '../paquetes.logica';
import { paquetesService } from '../services/paquetes.service';

afterEach(() => vi.restoreAllMocks());

const foto = (tipo = 'image/jpeg', bytes = 1000) =>
  new File([new Uint8Array(bytes)], 'p', { type: tipo });
const valido = () => ({
  ...paqueteVacio(),
  unidad: 'A-102',
  empresa: 'Servientrega',
  foto: foto(),
});

describe('paquetería', () => {
  it('las claves de caché incluyen el condominio', () => {
    expect(clavesPaquetes.garita(3)).toEqual(['paquetes', 3, 'garita']);
    expect(clavesPaquetes.mios(3)).not.toEqual(clavesPaquetes.mios(4));
  });

  it('un paquete válido no tiene errores', () => {
    expect(validarPaquete(valido())).toEqual({});
  });

  it('exige foto (JPG o PNG, hasta 5 MB), unidad y empresa', () => {
    expect(validarPaquete({ ...valido(), foto: null }).foto).toBe(
      'La foto del paquete es obligatoria.',
    );
    expect(validarPaquete({ ...valido(), foto: foto('application/pdf') }).foto).toContain(
      'JPG o PNG',
    );
    expect(
      validarPaquete({ ...valido(), foto: foto('image/png', 6 * 1024 * 1024) }).foto,
    ).toContain('5 MB');
    expect(validarPaquete({ ...valido(), unidad: ' ' }).unidad).toBeDefined();
    expect(validarPaquete({ ...valido(), empresa: 'A' }).empresa).toBeDefined();
    expect(validarPaquete({ ...valido(), descripcion: 'x'.repeat(61) }).descripcion).toBeDefined();
  });

  it('dice cuándo llegó y hace cuántos días', () => {
    const p = { descripcion: 'Caja mediana', recibido_en: '2026-10-17T09:20:00-05:00' };
    expect(detallePaquete(p, '2026-10-17')).toBe('Caja mediana · Hoy 09:20');
    expect(detallePaquete({ ...p, descripcion: null }, '2026-10-18')).toBe('Ayer 09:20');
    expect(haceDias(0)).toBe('hoy');
    expect(haceDias(1)).toBe('hace 1 día');
    expect(haceDias(8)).toBe('hace 8 días');
    expect(tituloMiPaquete({ empresa: 'Amazon', descripcion: 'Sobre' })).toBe('Amazon · Sobre');
    expect(tituloMiPaquete({ empresa: 'Amazon', descripcion: null })).toBe('Amazon');
  });

  it('para entregar pide quién retira y la firma', () => {
    expect(validarRetira('ocupante', 4, '', true)).toBeNull();
    expect(validarRetira('autorizado', null, 'Sofía Arteaga', true)).toBeNull();
    expect(validarRetira('ocupante', null, '', true)).toBe('Elige quién retira.');
    expect(validarRetira('autorizado', null, 'So', true)).toBe(
      'Escribe el nombre de quien retira.',
    );
    expect(validarRetira('ocupante', 4, '', false)).toBe('Falta la firma de quien retira.');
  });

  it('el servicio envía formularios y usa las rutas del contrato', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: {} } });
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: {} });

    await paquetesService.enGarita();
    expect(get).toHaveBeenCalledWith('/garita/paquetes');
    await paquetesService.mios();
    expect(get).toHaveBeenCalledWith('/mis-paquetes');

    await paquetesService.recibir({
      unidad_codigo: 'A-102',
      empresa: 'Servientrega',
      descripcion: null,
      foto: foto(),
    });
    const [rutaR, recibir] = post.mock.calls[0] as [string, FormData];
    expect(rutaR).toBe('/garita/paquetes');
    expect(recibir.get('unidad_codigo')).toBe('A-102');
    expect(recibir.get('foto')).toBeInstanceOf(File);
    expect(recibir.has('descripcion')).toBe(false);

    await paquetesService.entregar(8, {
      ocupante_id: 4,
      autorizado: null,
      firma: foto('image/png'),
    });
    const [rutaE, entregar] = post.mock.calls[1] as [string, FormData];
    expect(rutaE).toBe('/garita/paquetes/8/entregar');
    expect(entregar.get('ocupante_id')).toBe('4');
    expect(entregar.has('autorizado')).toBe(false);
    expect(entregar.get('firma')).toBeInstanceOf(File);
  });
});
