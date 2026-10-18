import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import { clavesVisitas } from '../composables/useVisitas';
import { visitasService, type VisitaAutorizada } from '../services/visitas.service';
import {
  cuandoVisita,
  cuentaAtras,
  enlacesComoLlegar,
  mensajeParaVisitante,
  peticionVisita,
  segundosRestantes,
  textoTipoSolicitud,
  textoDias,
  urlPublicaVisita,
  validarVisita,
  vigenciaVisita,
  visitaVacia,
} from '../visitas.logica';

afterEach(() => vi.restoreAllMocks());

const hoy = '2026-10-17';
const valida = () => ({
  ...visitaVacia(hoy),
  unidadId: 4,
  nombre: 'Juan Pérez',
  fecha: '2026-10-20',
});
const visita = (extra: Partial<VisitaAutorizada> = {}): VisitaAutorizada => ({
  id: 1,
  unidad: 'A-102',
  visitante: 'Juan Pérez',
  placa: null,
  tipo: 'unica',
  fecha_desde: '2026-10-17',
  fecha_hasta: '2026-10-17',
  hora_desde: '18:00',
  hora_hasta: '22:00',
  dias_semana: null,
  token: '7-abc',
  ...extra,
});

describe('visitas con QR', () => {
  it('las claves de caché incluyen el condominio', () => {
    expect(clavesVisitas.mias(3)).toEqual(['visitas', 3, 'mias']);
    expect(clavesVisitas.mias(3)).not.toEqual(clavesVisitas.mias(4));
  });

  it('una visita válida no tiene errores y se arma para la API', () => {
    expect(validarVisita(valida(), hoy, '10:00')).toEqual({});
    expect(peticionVisita({ ...valida(), placa: 'pdq-3321', cedula: ' ' })).toMatchObject({
      unidad_id: 4,
      visitante: 'Juan Pérez',
      documento: null,
      placa: 'PDQ-3321',
      tipo: 'unica',
      fecha_desde: '2026-10-20',
      fecha_hasta: null,
      dias_semana: null,
    });
  });

  it('valida nombre, formatos, fecha y horas', () => {
    const base = valida();
    expect(validarVisita({ ...base, nombre: 'Ab' }, hoy, '10:00').nombre).toBeDefined();
    expect(validarVisita({ ...base, cedula: '12 34' }, hoy, '10:00').cedula).toBeDefined();
    expect(validarVisita({ ...base, placa: 'ZZZ' }, hoy, '10:00').placa).toBeDefined();
    expect(validarVisita({ ...base, unidadId: null }, hoy, '10:00').unidadId).toBeDefined();
    expect(validarVisita({ ...base, fecha: '2026-10-10' }, hoy, '10:00').fecha).toContain(
      'anterior',
    );
    expect(
      validarVisita({ ...base, desde: '20:00', hasta: '15:00' }, hoy, '10:00').hasta,
    ).toContain('posterior');
    // Hoy, con el horario ya pasado
    expect(
      validarVisita({ ...base, fecha: hoy, hasta: '09:00', desde: '08:00' }, hoy, '10:00').hasta,
    ).toContain('ya pasó');
  });

  it('una visita recurrente exige días y una vigencia de hasta un año', () => {
    const rec = {
      ...valida(),
      tipo: 'recurrente' as const,
      dias: [3, 1, 5],
      vigenteHasta: '2026-12-31',
    };
    expect(validarVisita(rec, hoy, '10:00')).toEqual({});
    expect(peticionVisita(rec)).toMatchObject({
      fecha_hasta: '2026-12-31',
      dias_semana: [1, 3, 5],
    });
    expect(validarVisita({ ...rec, dias: [] }, hoy, '10:00').dias).toBeDefined();
    expect(
      validarVisita({ ...rec, vigenteHasta: '2028-01-01' }, hoy, '10:00').vigenteHasta,
    ).toContain('año');
    expect(
      validarVisita({ ...rec, vigenteHasta: '2026-10-01' }, hoy, '10:00').vigenteHasta,
    ).toBeDefined();
  });

  it('dice los días y cuándo es la visita como en el mockup', () => {
    expect(textoDias([1, 2, 3, 4, 5])).toBe('Lun a vie');
    expect(textoDias([1, 3, 5])).toBe('Lun, mié y vie');
    expect(textoDias([1, 2, 3, 4, 5, 6, 7])).toBe('Todos los días');
    expect(textoDias([6])).toBe('Sáb');
    expect(cuandoVisita(visita(), hoy)).toBe('Hoy · 18:00 – 22:00');
    expect(cuandoVisita(visita({ fecha_desde: '2026-10-20' }), hoy)).toMatch(
      /^Mar 20 oct · 18:00 – 22:00$/,
    );
    expect(
      cuandoVisita(
        visita({
          tipo: 'recurrente',
          dias_semana: [1, 3, 5],
          hora_desde: '07:00',
          hora_hasta: '16:00',
        }),
        hoy,
      ),
    ).toBe('Lun, mié y vie · 07:00 – 16:00');
    expect(vigenciaVisita(visita())).toContain('un solo ingreso');
    expect(
      vigenciaVisita(
        visita({ tipo: 'recurrente', dias_semana: [1, 2, 3, 4, 5], fecha_hasta: '2026-12-31' }),
      ),
    ).toBe('Lun a vie · 18:00–22:00 · hasta el 31 dic');
  });

  it('arma el mensaje y el enlace público sin datos personales', () => {
    expect(urlPublicaVisita('7-abc', 'https://app.safic.ec')).toBe(
      'https://app.safic.ec/visita/7-abc',
    );
    const m = mensajeParaVisitante(
      visita({ token: '7-abc' }),
      'Jardines del Valle',
      'https://app.safic.ec',
    );
    expect(m).toContain('Hola Juan, te espero en Jardines del Valle, A-102.');
    expect(m).toContain('https://app.safic.ec/visita/7-abc');
    expect(m).not.toContain('Pérez');
  });

  it('el «cómo llegar» usa las coordenadas y, si faltan, la dirección', () => {
    const base = { nombre: 'Jardines', direccion: null, latitud: null, longitud: null };
    expect(enlacesComoLlegar(base)).toBeNull();
    expect(enlacesComoLlegar({ ...base, latitud: '-0.18', longitud: '-78.46' })?.maps).toContain(
      '-0.18,-78.46',
    );
    expect(enlacesComoLlegar({ ...base, direccion: 'Av. Siempre Viva 123' })?.waze).toContain(
      'Av.%20Siempre%20Viva%20123',
    );
  });

  it('la cuenta atrás descuenta lo que pasó desde la consulta', () => {
    expect(segundosRestantes(102, 1_000_000, 1_000_000)).toBe(102);
    expect(segundosRestantes(102, 1_000_000, 1_042_000)).toBe(60);
    expect(segundosRestantes(10, 1_000_000, 1_999_000)).toBe(0);
    expect(cuentaAtras(102)).toBe('1:42');
    expect(cuentaAtras(5)).toBe('0:05');
    expect(cuentaAtras(-3)).toBe('0:00');
    expect(textoTipoSolicitud('delivery')).toBe('Delivery');
  });

  it('las claves de las solicitudes de ingreso incluyen el condominio', () => {
    expect(clavesVisitas.solicitudes(3)).toEqual(['visitas', 3, 'solicitudes']);
    expect(clavesVisitas.solicitudes(3)).not.toEqual(clavesVisitas.solicitudes(4));
  });

  it('el servicio de solicitudes usa las rutas del contrato', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: [] } });
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: {} });
    await visitasService.solicitudes();
    expect(get).toHaveBeenCalledWith('/mis-solicitudes-ingreso');
    await visitasService.responder(7, true);
    expect(post).toHaveBeenCalledWith('/mis-solicitudes-ingreso/7/responder', { permitir: true });
    await visitasService.responder(7, false);
    expect(post).toHaveBeenCalledWith('/mis-solicitudes-ingreso/7/responder', { permitir: false });
  });

  it('el servicio usa las rutas del contrato', async () => {
    const get = vi
      .spyOn(api, 'get')
      .mockResolvedValue({ data: { data: { unidades: [], visitas: [] } } });
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: visita() } });

    await visitasService.mias();
    expect(get).toHaveBeenCalledWith('/mis-visitas');
    await visitasService.autorizar(peticionVisita(valida()));
    expect(post).toHaveBeenCalledWith(
      '/mis-visitas',
      expect.objectContaining({ visitante: 'Juan Pérez' }),
    );
    await visitasService.revocar(9);
    expect(post).toHaveBeenCalledWith('/mis-visitas/9/revocar');
    await visitasService.publica('7-a/b');
    expect(get).toHaveBeenCalledWith('/publico/visitas/7-a%2Fb', { saltarRefresco: true });
  });
});
