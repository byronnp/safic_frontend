import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import {
  accionSecundaria,
  alternarInterruptor,
  avisoTipo,
  cambiosTipo,
  duracionDeMinutos,
  etiquetasTipo,
  formularioDesde,
  formularioNuevo,
  inicialesTipo,
  minutosDeDuracion,
  peticionNueva,
  validarTipo,
} from '../catalogo-amenidades.logica';
import { clavesCatalogoAmenidades } from '../composables/useCatalogoAmenidades';
import {
  catalogoAmenidadesService,
  type AmenidadPropia,
  type TipoCatalogo,
} from '../services/catalogo-amenidades.service';

afterEach(() => vi.restoreAllMocks());

function tipo(cambios: Partial<TipoCatalogo> = {}): TipoCatalogo {
  return {
    id: 1,
    nombre: 'Área BBQ',
    descripcion: 'Parrilla con mesas',
    categoria: 'social',
    reservable: true,
    esencial: false,
    requiere_aprobacion: false,
    capacidad: 20,
    duracion_maxima_min: 240,
    orden: 3,
    activa: true,
    uso: 6,
    ...cambios,
  };
}

describe('servicio del catálogo de plataforma', () => {
  it('usa las rutas de plataforma, sin condominio', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: [tipo()] } });
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: tipo() } });
    const patch = vi.spyOn(api, 'patch').mockResolvedValue({ data: { data: tipo() } });
    const borrar = vi.spyOn(api, 'delete').mockResolvedValue({ data: {} });

    expect((await catalogoAmenidadesService.listar())[0]?.nombre).toBe('Área BBQ');
    expect(get).toHaveBeenCalledWith('/plataforma/catalogo-amenidades');
    await catalogoAmenidadesService.propias();
    expect(get).toHaveBeenLastCalledWith('/plataforma/catalogo-amenidades/propias');

    await catalogoAmenidadesService.crear({ nombre: 'Sala de cine' });
    expect(post).toHaveBeenCalledWith('/plataforma/catalogo-amenidades', {
      nombre: 'Sala de cine',
    });
    await catalogoAmenidadesService.editar(4, { activa: false });
    expect(patch).toHaveBeenCalledWith('/plataforma/catalogo-amenidades/4', { activa: false });
    await catalogoAmenidadesService.eliminar(4);
    expect(borrar).toHaveBeenCalledWith('/plataforma/catalogo-amenidades/4');
    await catalogoAmenidadesService.promover(7, 12);
    expect(post).toHaveBeenLastCalledWith('/plataforma/catalogo-amenidades/propias/7/12/promover');
  });

  it('las claves de caché son de plataforma (no llevan condominio)', () => {
    expect(clavesCatalogoAmenidades.tipos).toEqual(['plataforma', 'catalogo-amenidades', 'tipos']);
    expect(clavesCatalogoAmenidades.propias).toEqual([
      'plataforma',
      'catalogo-amenidades',
      'propias',
    ]);
    expect(clavesCatalogoAmenidades.tipos.slice(0, 2)).toEqual(clavesCatalogoAmenidades.todas);
  });
});

describe('duración', () => {
  it('lee "3 h", "1,5 h" y "90 min"; vacío es sin duración', () => {
    expect(minutosDeDuracion('3 h')).toEqual({ ok: true, minutos: 180 });
    expect(minutosDeDuracion('1,5 h')).toEqual({ ok: true, minutos: 90 });
    expect(minutosDeDuracion('2h')).toEqual({ ok: true, minutos: 120 });
    expect(minutosDeDuracion('90 min')).toEqual({ ok: true, minutos: 90 });
    expect(minutosDeDuracion('')).toEqual({ ok: true, minutos: null });
    expect(minutosDeDuracion('—')).toEqual({ ok: true, minutos: null });
    expect(minutosDeDuracion('mucho')).toEqual({ ok: false });
    expect(minutosDeDuracion('90')).toEqual({ ok: false });
  });

  it('la escribe como el mockup', () => {
    expect(duracionDeMinutos(180)).toBe('3 h');
    expect(duracionDeMinutos(90)).toBe('1,5 h');
    expect(duracionDeMinutos(45)).toBe('45 min');
    expect(duracionDeMinutos(null)).toBe('');
  });
});

describe('lista y formulario', () => {
  it('etiquetas de comportamiento e iniciales', () => {
    expect(etiquetasTipo(tipo({ requiere_aprobacion: true })).map((e) => e.texto)).toEqual([
      'Reservable',
      'Con aprobación',
    ]);
    expect(etiquetasTipo(tipo({ reservable: false, esencial: true })).map((e) => e.texto)).toEqual([
      'Esencial',
    ]);
    expect(etiquetasTipo(tipo({ reservable: false })).map((e) => e.texto)).toEqual(['Informativa']);
    expect(inicialesTipo('Área BBQ')).toBe('ÁB');
    expect(inicialesTipo('Guardianía 24 h')).toBe('G2');
  });

  it('el panel parte de lo guardado, también para una propia', () => {
    expect(formularioDesde(tipo())).toMatchObject({
      nombre: 'Área BBQ',
      orden: '3',
      capacidad: '20',
      duracion: '4 h',
      categoria: 'social',
    });

    const propia: AmenidadPropia = {
      id: 9,
      condominio_id: 2,
      condominio: 'Brisas del Mar',
      nombre: 'Muelle',
      categoria: 'recreacion',
      reservable: true,
      esencial: false,
      requiere_aprobacion: true,
      activa: true,
    };
    expect(formularioDesde(propia)).toMatchObject({
      nombre: 'Muelle',
      requiereAprobacion: true,
      capacidad: '',
      duracion: '',
    });
  });

  it('reservable y esencial se excluyen y lo que depende de reservar se limpia', () => {
    const f = formularioDesde(tipo({ requiere_aprobacion: true }));

    alternarInterruptor(f, 'esencial', true);
    expect(f).toMatchObject({
      esencial: true,
      reservable: false,
      requiereAprobacion: false,
      duracion: '',
    });

    alternarInterruptor(f, 'reservable', true);
    expect(f).toMatchObject({ esencial: false, reservable: true });

    alternarInterruptor(f, 'activa', false);
    expect(f.activa).toBe(false);
  });

  it('valida nombre, orden, capacidad y duración', () => {
    const f = formularioNuevo(5);
    expect(validarTipo({ ...f, nombre: 'Sala de cine' })).toEqual({});
    expect(validarTipo(f).nombre).toBe('Escribe el nombre de la amenidad.');
    expect(validarTipo({ ...f, nombre: 'a' }).nombre).toContain('mínimo 2');
    expect(validarTipo({ ...f, nombre: 'Ok', orden: '1000' }).orden).toBe(
      'El orden va de 0 a 999.',
    );
    expect(validarTipo({ ...f, nombre: 'Ok', capacidad: '0' }).capacidad).toBe(
      'La capacidad va de 1 a 9999.',
    );
    expect(validarTipo({ ...f, nombre: 'Ok', duracion: 'mucho' }).duracion).toContain(
      '"3 h" o "90 min"',
    );
    expect(validarTipo({ ...f, nombre: 'Ok', duracion: '5 min' }).duracion).toContain('15 minutos');
    expect(validarTipo({ ...f, nombre: 'Ok', duracion: '25 h' }).duracion).toContain('24 horas');
  });

  it('crea con todos los valores y edita solo lo que cambió', () => {
    const nuevo = {
      ...formularioNuevo(5),
      nombre: ' Sala de cine ',
      capacidad: '20',
      duracion: '3 h',
      descripcion: '',
    };
    expect(peticionNueva(nuevo)).toMatchObject({
      nombre: 'Sala de cine',
      descripcion: null,
      categoria: 'recreacion',
      reservable: true,
      capacidad: 20,
      duracion_maxima_min: 180,
      orden: 5,
      activa: true,
    });

    const original = tipo();
    const f = formularioDesde(original);
    expect(cambiosTipo(f, original)).toEqual({});
    expect(cambiosTipo({ ...f, capacidad: '30', activa: false }, original)).toEqual({
      capacidad: 30,
      activa: false,
    });
    expect(cambiosTipo({ ...f, duracion: '' }, original)).toEqual({ duracion_maxima_min: null });
    expect(cambiosTipo({ ...f, capacidad: '' }, original)).toEqual({ capacidad: null });
  });
});

describe('avisos y acciones', () => {
  const base = { ambito: 'global' as const, nuevo: false, guardado: false, error: null, uso: 0 };

  it('el aviso depende del ámbito, del uso y del estado', () => {
    expect(avisoTipo({ ...base, error: 'Algo falló' })).toEqual({
      tono: 'error',
      texto: 'Algo falló',
    });
    expect(avisoTipo({ ...base, guardado: true }).tono).toBe('exito');
    expect(avisoTipo({ ...base, nuevo: true }).texto).toContain('no puede repetirse');
    expect(avisoTipo({ ...base, uso: 6 })).toMatchObject({ tono: 'uso' });
    expect(avisoTipo({ ...base, uso: 1 }).texto).toContain('1 condominio:');
    expect(avisoTipo(base).texto).toBe('Ningún condominio la usa. Se puede eliminar.');
    expect(avisoTipo({ ...base, ambito: 'propias' }).tono).toBe('info');
  });

  it('la acción secundaria: cancelar, promover, desactivar/activar o eliminar', () => {
    expect(accionSecundaria({ ambito: 'global', nuevo: true, uso: 0, activa: true }).accion).toBe(
      'cancelar',
    );
    expect(
      accionSecundaria({ ambito: 'propias', nuevo: false, uso: 0, activa: true }),
    ).toMatchObject({ accion: 'promover', texto: 'Promover a global' });
    expect(
      accionSecundaria({ ambito: 'global', nuevo: false, uso: 3, activa: true }),
    ).toMatchObject({ accion: 'alternar', texto: 'Desactivar' });
    expect(accionSecundaria({ ambito: 'global', nuevo: false, uso: 3, activa: false }).texto).toBe(
      'Activar',
    );
    expect(
      accionSecundaria({ ambito: 'global', nuevo: false, uso: 0, activa: true }),
    ).toMatchObject({ accion: 'eliminar', tono: 'peligro' });
  });
});
