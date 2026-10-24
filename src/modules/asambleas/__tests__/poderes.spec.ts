import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import { clavesAsambleas } from '../composables/useAsambleas';
import {
  aSolicitudPoder,
  mensajeDePoder,
  poderVacio,
  poderVigente,
  validarPoder,
} from '../poderes.logica';
import { asambleasService } from '../services/asambleas.service';

afterEach(() => vi.restoreAllMocks());

const pdf = () => new File(['x'], 'poder.pdf', { type: 'application/pdf' });
const valido = () => ({
  ...poderVacio(7),
  nombre: 'Marta Vera Cano',
  documento: '1710034065',
  archivo: pdf(),
});

describe('poderes: formulario', () => {
  it('un poder completo es válido', () => {
    expect(validarPoder(valido())).toEqual({});
  });

  it('pide unidad, nombre, cédula válida y PDF', () => {
    const e = validarPoder(poderVacio());
    expect(Object.keys(e).sort()).toEqual(['archivo', 'documento', 'nombre', 'unidadId']);
    expect(validarPoder({ ...valido(), documento: '1712345678' }).documento).toMatch(
      /no es válida/,
    );
  });

  it('el pasaporte no se valida como cédula', () => {
    const f = { ...valido(), tipoDocumento: 'pasaporte' as const, documento: 'AB123456' };
    expect(validarPoder(f)).toEqual({});
    expect(validarPoder({ ...f, documento: 'AB1' }).documento).toBeDefined();
  });

  it('solo PDF de hasta 10 MB', () => {
    const png = new File(['x'], 'poder.png', { type: 'image/png' });
    expect(validarPoder({ ...valido(), archivo: png }).archivo).toMatch(/PDF/);
    const grande = new File(['x'], 'poder.pdf', { type: 'application/pdf' });
    Object.defineProperty(grande, 'size', { value: 11 * 1024 * 1024 });
    expect(validarPoder({ ...valido(), archivo: grande }).archivo).toMatch(/10 MB/);
  });

  it('arma la solicitud recortando los textos', () => {
    const f = { ...valido(), nombre: '  Marta Vera Cano ', documento: ' 1710034065 ' };
    expect(aSolicitudPoder(f)).toMatchObject({
      unidad_id: 7,
      tipo: 'carta',
      representante_nombre: 'Marta Vera Cano',
      representante_tipo_documento: 'cedula',
      representante_documento: '1710034065',
    });
  });

  it('dice al propietario qué pasó con su poder', () => {
    expect(mensajeDePoder({ estado: 'pendiente', motivo_rechazo: null })).toMatch(/revisando/);
    expect(mensajeDePoder({ estado: 'rechazado', motivo_rechazo: 'Firma ilegible' })).toMatch(
      /Firma ilegible/,
    );
    expect(poderVigente({ estado: 'validado' })).toBe(true);
    expect(poderVigente({ estado: 'rechazado' })).toBe(false);
  });
});

describe('poderes: servicio y caché', () => {
  it('las claves llevan el condominio', () => {
    expect(clavesAsambleas.poderes(7, 3)).toEqual(['asambleas', 7, 'poderes', 3]);
    expect(clavesAsambleas.mias(7)).toEqual(['asambleas', 7, 'mias']);
  });

  it('usa las rutas del contrato y sube el PDF como formulario', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: {} } });
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: {} } });
    const del = vi.spyOn(api, 'delete').mockResolvedValue({ data: { data: {} } });
    const datos = aSolicitudPoder(valido());

    await asambleasService.poderes(4);
    await asambleasService.misAsambleas();
    await asambleasService.cargarPoder(4, datos);
    await asambleasService.validarPoder(9);
    await asambleasService.rechazarPoder(9, 'Firma ilegible');
    await asambleasService.retirarPoder(9);

    expect(get).toHaveBeenCalledWith('/asambleas/4/poderes');
    expect(get).toHaveBeenCalledWith('/mis-asambleas');
    const [ruta, cuerpo] = post.mock.calls[0] as [string, FormData];
    expect(ruta).toBe('/asambleas/4/poderes');
    expect(cuerpo.get('unidad_id')).toBe('7');
    expect(cuerpo.get('representante_documento')).toBe('1710034065');
    expect(cuerpo.get('archivo')).toBe(datos.archivo);
    expect(post).toHaveBeenCalledWith('/poderes/9/validar');
    expect(post).toHaveBeenCalledWith('/poderes/9/rechazar', { motivo: 'Firma ilegible' });
    expect(del).toHaveBeenCalledWith('/poderes/9');
  });
});
