import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import { clavesIncidencias } from '../composables/useIncidencias';
import {
  accionAvanzar,
  armarTablero,
  comentariosPublicos,
  etiquetaCategoria,
  hace,
  incidenciaVacia,
  insigniaEstado,
  peticionIncidencia,
  textoTiempoPromedio,
  ultimaRespuestaPublica,
  validarIncidencia,
} from '../incidencias.logica';
import { incidenciasService, type FilaTablero } from '../services/incidencias.service';

afterEach(() => vi.restoreAllMocks());

const foto = (tipo = 'image/jpeg', bytes = 1000) =>
  new File([new Uint8Array(bytes)], 'f', { type: tipo });
const valida = () => ({
  ...incidenciaVacia(),
  titulo: 'Fuga de agua',
  descripcion: 'Gotea desde ayer.',
  categoria: 'mantenimiento' as const,
  unidadId: 4,
});

describe('incidencias', () => {
  it('las claves de caché incluyen el condominio', () => {
    expect(clavesIncidencias.tablero(3)).toEqual(['comunicacion', 3, 'incidencias', 'tablero']);
    expect(clavesIncidencias.detalle(3, 9)).not.toEqual(clavesIncidencias.detalle(4, 9));
    expect(clavesIncidencias.mias(3)).not.toEqual(clavesIncidencias.mias(4));
  });

  it('una incidencia válida no tiene errores y se arma para la API', () => {
    expect(validarIncidencia(valida())).toEqual({});
    expect(peticionIncidencia({ ...valida(), titulo: ' Fuga ' })).toMatchObject({
      titulo: 'Fuga',
      categoria: 'mantenimiento',
      unidad_id: 4,
      fotos: [],
    });
  });

  it('valida título, detalle, categoría y fotos', () => {
    expect(validarIncidencia({ ...valida(), titulo: 'Ab' }).titulo).toBeDefined();
    expect(validarIncidencia({ ...valida(), descripcion: ' ' }).descripcion).toBeDefined();
    expect(validarIncidencia({ ...valida(), categoria: null }).categoria).toBe(
      'Elige una categoría.',
    );
    expect(
      validarIncidencia({ ...valida(), fotos: [foto(), foto(), foto(), foto()] }).fotos,
    ).toContain('Máximo 3');
    expect(validarIncidencia({ ...valida(), fotos: [foto('application/pdf')] }).fotos).toContain(
      'JPG o PNG',
    );
    expect(
      validarIncidencia({ ...valida(), fotos: [foto('image/png', 6 * 1024 * 1024)] }).fotos,
    ).toContain('5 MB');
  });

  it('el botón de avanzar sigue el flujo y se apaga al resolver', () => {
    expect(accionAvanzar('abierto')).toEqual({
      texto: 'Pasar a En proceso',
      siguiente: 'en_proceso',
    });
    expect(accionAvanzar('en_proceso')).toEqual({
      texto: 'Marcar resuelto',
      siguiente: 'resuelto',
    });
    expect(accionAvanzar('resuelto')).toEqual({ texto: 'Esperando al residente', siguiente: null });
    expect(accionAvanzar('cerrado').siguiente).toBeNull();
    expect(insigniaEstado('resuelto').tono).toBe('exito');
    expect(etiquetaCategoria('areas_verdes')).toBe('Áreas verdes');
  });

  it('al residente nunca se le muestran las notas internas', () => {
    const c = (id: number, interna: boolean, texto: string) => ({
      id,
      autor: 'x',
      de_administracion: true,
      interna,
      texto,
      creado_en: '2026-10-17T10:00:00-05:00',
    });
    const lista = [c(1, false, 'Viene mañana.'), c(2, true, 'Cotización $85. No visible.')];
    expect(comentariosPublicos(lista).map((x) => x.id)).toEqual([1]);
    expect(ultimaRespuestaPublica(lista)).toBe('Viene mañana.');
    expect(ultimaRespuestaPublica([c(3, true, 'solo interna')])).toBeNull();
  });

  it('arma las cuatro columnas del tablero', () => {
    const f = (id: number, estado: FilaTablero['estado']): FilaTablero => ({
      id,
      numero: id,
      titulo: 't',
      categoria: 'otro',
      prioridad: 'media',
      estado,
      unidad: null,
      creada_en: '2026-10-17T10:00:00-05:00',
    });
    const t = armarTablero([f(1, 'abierto'), f(2, 'abierto'), f(3, 'resuelto')]);
    expect(t.map((c) => [c.nombre, c.items.length])).toEqual([
      ['Abierto', 2],
      ['En proceso', 0],
      ['Resuelto', 1],
      ['Cerrado', 0],
    ]);
  });

  it('dice cuánto hace y el tiempo promedio', () => {
    const base = new Date('2026-10-17T12:00:00Z').getTime();
    expect(hace('2026-10-17T11:59:30Z', base)).toBe('hace un momento');
    expect(hace('2026-10-17T11:30:00Z', base)).toBe('hace 30 min');
    expect(hace('2026-10-17T10:00:00Z', base)).toBe('hace 2 h');
    expect(hace('2026-10-16T10:00:00Z', base)).toBe('hace 1 día');
    expect(hace('2026-10-12T12:00:00Z', base)).toBe('hace 5 días');
    expect(textoTiempoPromedio(null)).toBe('—');
    expect(textoTiempoPromedio(6)).toBe('6 h');
    expect(textoTiempoPromedio(2.5)).toBe('2,5 h');
    expect(textoTiempoPromedio(0.4)).toBe('24 min');
  });

  it('el servicio usa las rutas del contrato y envía las fotos como formulario', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: [] } });
    const post = vi
      .spyOn(api, 'post')
      .mockResolvedValue({ data: { data: { id: 1, numero: 214 } } });
    const patch = vi.spyOn(api, 'patch').mockResolvedValue({ data: {} });

    await incidenciasService.tablero();
    expect(get).toHaveBeenCalledWith('/comunicacion/incidencias');
    await incidenciasService.detalle(9);
    expect(get).toHaveBeenCalledWith('/comunicacion/incidencias/9');
    await incidenciasService.mias();
    expect(get).toHaveBeenCalledWith('/mis-incidencias');

    await incidenciasService.comentar(9, 'Viene mañana', false);
    expect(post).toHaveBeenCalledWith('/comunicacion/incidencias/9/comentarios', {
      texto: 'Viene mañana',
      interna: false,
    });
    await incidenciasService.cambiarEstado(9, 'en_proceso');
    expect(post).toHaveBeenCalledWith('/comunicacion/incidencias/9/estado', {
      estado: 'en_proceso',
    });
    await incidenciasService.ajustar(9, { prioridad: 'alta' });
    expect(patch).toHaveBeenCalledWith('/comunicacion/incidencias/9', { prioridad: 'alta' });

    expect(
      await incidenciasService.reportar({
        ...peticionIncidencia({ ...valida(), fotos: [foto(), foto('image/png')] }),
      }),
    ).toEqual({ numero: 214 });
    const [ruta, formulario] = post.mock.calls.find((c) => c[0] === '/mis-incidencias') as [
      string,
      FormData,
    ];
    expect(ruta).toBe('/mis-incidencias');
    expect(formulario.getAll('fotos[]')).toHaveLength(2);
    expect(formulario.get('unidad_id')).toBe('4');

    await incidenciasService.reabrir(9, null);
    expect(post).toHaveBeenCalledWith('/mis-incidencias/9/reabrir', { texto: null });
    await incidenciasService.confirmar(9);
    expect(post).toHaveBeenCalledWith('/mis-incidencias/9/confirmar');
    await incidenciasService.comentarMia(9, 'Hola');
    expect(post).toHaveBeenCalledWith('/mis-incidencias/9/comentarios', { texto: 'Hola' });
  });
});
