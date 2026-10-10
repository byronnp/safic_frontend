import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import {
  colorAmenidad,
  detalleAmenidad,
  estadoAmenidad,
  FORMULARIO_AMENIDAD_VACIO,
  inicialesAmenidad,
  kpisAmenidades,
  nombresPrevistos,
  peticionAmenidad,
  tonoEstadoAmenidad,
  errorFoto,
  errorUbicacion,
  moverFoto,
  ubicacionParaGuardar,
  ubicacionesSugeridas,
  usoAmenidad,
  vistaAmenidad,
  type FormularioAmenidad,
} from '../amenidades.logica';
import { clavesAmenidades } from '../composables/useAmenidades';
import {
  amenidadesService,
  type AmenidadCondominio,
  type TipoCatalogo,
} from '../services/amenidades.service';

afterEach(() => vi.restoreAllMocks());

function amenidad(cambios: Partial<AmenidadCondominio> = {}): AmenidadCondominio {
  return {
    id: 1,
    nombre: 'Piscina',
    origen: 'catalogo',
    tipo: 'Piscina',
    categoria: 'recreacion',
    cantidad: 1,
    ubicacion: 'Área social',
    reservable: true,
    esencial: false,
    requiere_aprobacion: false,
    capacidad: null,
    duracion_maxima_min: null,
    estado: 'disponible',
    mantenimiento_hasta: null,
    fotos: [],
    ...cambios,
  };
}

const BBQ: TipoCatalogo = {
  id: 1,
  nombre: 'Área BBQ',
  categoria: 'social',
  descripcion: null,
  reservable: true,
  esencial: false,
  requiere_aprobacion: false,
};
const ASCENSOR: TipoCatalogo = {
  ...BBQ,
  id: 2,
  nombre: 'Ascensor',
  categoria: 'servicios',
  reservable: false,
  esencial: true,
};
const CATALOGO = [BBQ, ASCENSOR];

function formulario(cambios: Partial<FormularioAmenidad> = {}): FormularioAmenidad {
  return { ...FORMULARIO_AMENIDAD_VACIO, ...cambios };
}

describe('servicio de amenidades', () => {
  it('lista, trae el catálogo, agrega y actualiza en sus rutas', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: [amenidad()] } });
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: [amenidad()] } });
    const patch = vi.spyOn(api, 'patch').mockResolvedValue({ data: { data: amenidad() } });

    expect((await amenidadesService.listar())[0]?.nombre).toBe('Piscina');
    expect(get).toHaveBeenCalledWith('/amenidades');

    await amenidadesService.catalogo();
    expect(get).toHaveBeenLastCalledWith('/amenidades/catalogo');

    const nueva = peticionAmenidad(formulario({ tipoId: 1 }));
    await amenidadesService.agregar(nueva);
    expect(post).toHaveBeenCalledWith('/amenidades', nueva);

    await amenidadesService.actualizar(7, { mantenimiento_hasta: '2026-12-01' });
    expect(patch).toHaveBeenCalledWith('/amenidades/7', { mantenimiento_hasta: '2026-12-01' });
  });

  it('las claves de caché incluyen el condominio', () => {
    expect(clavesAmenidades.todas(3)).toEqual(['amenidades', 3]);
    expect(clavesAmenidades.catalogo(3)).toEqual(['amenidades', 3, 'catalogo']);
    expect(clavesAmenidades.todas(4)).not.toEqual(clavesAmenidades.todas(3));
  });
});

describe('textos de la lista', () => {
  it('uso, estado y color', () => {
    expect(usoAmenidad(amenidad())).toBe('Reservable');
    expect(usoAmenidad(amenidad({ reservable: false }))).toBe('Uso libre');
    expect(usoAmenidad(amenidad({ esencial: true, reservable: false }))).toBe(
      'Esencial · no se restringe',
    );

    expect(estadoAmenidad(amenidad())).toBe('Disponible');
    expect(estadoAmenidad(amenidad({ estado: 'inactiva' }))).toBe('Inactiva');
    expect(
      estadoAmenidad(amenidad({ estado: 'mantenimiento', mantenimiento_hasta: '2026-09-30' })),
    ).toBe('Mantenimiento hasta 30 sept');
    expect(tonoEstadoAmenidad(amenidad({ estado: 'mantenimiento' }))).toBe('alerta');
    expect(tonoEstadoAmenidad(amenidad({ estado: 'inactiva' }))).toBe('neutro');

    expect(colorAmenidad(amenidad())).toBe('#0E5E5B');
    expect(colorAmenidad(amenidad({ categoria: null }))).toBe('#5F5B52');
  });

  it('iniciales como el mockup', () => {
    expect(inicialesAmenidad('Área BBQ 1')).toBe('ÁB');
    expect(inicialesAmenidad('Ascensor (3)')).toBe('A');
    expect(inicialesAmenidad('Piscina')).toBe('P');
  });

  it('el detalle junta lo que se sabe', () => {
    expect(
      detalleAmenidad(
        amenidad({ capacidad: 30, duracion_maxima_min: 180, requiere_aprobacion: true }),
      ),
    ).toBe('Capacidad 30 · reservas de 3 h · con aprobación');
    expect(detalleAmenidad(amenidad({ duracion_maxima_min: 90 }))).toBe('reservas de 1,5 h');
    expect(detalleAmenidad(amenidad({ reservable: false, cantidad: 3 }))).toBe(
      'cantidad 3 · un solo registro',
    );
    expect(detalleAmenidad(amenidad({ reservable: false }))).toBe('Uso libre');
    expect(detalleAmenidad(amenidad())).toBe('Se reserva');
  });

  it('los indicadores no cuentan las inactivas', () => {
    const lista = [
      amenidad({ id: 1 }),
      amenidad({ id: 2, reservable: false, origen: 'propia', tipo: null }),
      amenidad({ id: 3, estado: 'mantenimiento' }),
      amenidad({ id: 4, estado: 'inactiva' }),
    ];

    expect(kpisAmenidades(lista)).toEqual([
      { l: 'Amenidades', v: 3 },
      { l: 'Reservables', v: 2 },
      { l: 'En mantenimiento', v: 1 },
      { l: 'Propias', v: 1 },
    ]);
  });
});

describe('agregar amenidades', () => {
  it('varias reservables son registros separados y la numeración sigue donde iba', () => {
    expect(nombresPrevistos(formulario({ tipoId: 1, cantidad: 2 }), CATALOGO, [])).toEqual([
      'Área BBQ 1',
      'Área BBQ 2',
    ]);

    const dos = [
      amenidad({ id: 1, nombre: 'Área BBQ 1', tipo: 'Área BBQ' }),
      amenidad({ id: 2, nombre: 'Área BBQ 2', tipo: 'Área BBQ' }),
    ];
    expect(nombresPrevistos(formulario({ tipoId: 1, cantidad: 1 }), CATALOGO, dos)).toEqual([
      'Área BBQ 3',
    ]);
    expect(nombresPrevistos(formulario({ tipoId: 1, cantidad: 2 }), CATALOGO, dos)).toEqual([
      'Área BBQ 3',
      'Área BBQ 4',
    ]);
  });

  it('una que no se reserva es un solo registro con su cantidad', () => {
    expect(nombresPrevistos(formulario({ tipoId: 2, cantidad: 3 }), CATALOGO, [])).toEqual([
      'Ascensor (3)',
    ]);
    expect(nombresPrevistos(formulario({ tipoId: 2, cantidad: 1 }), CATALOGO, [])).toEqual([
      'Ascensor',
    ]);
  });

  it('las propias parten de 1 y respetan si son reservables', () => {
    const base = formulario({ origen: 'propia', nombre: ' Muelle ', reservable: true });
    expect(nombresPrevistos({ ...base, cantidad: 2 }, CATALOGO, [])).toEqual([
      'Muelle 1',
      'Muelle 2',
    ]);
    expect(nombresPrevistos({ ...base, reservable: false, cantidad: 2 }, CATALOGO, [])).toEqual([
      'Muelle (2)',
    ]);
    expect(nombresPrevistos({ ...base, nombre: '  ' }, CATALOGO, [])).toEqual([]);
  });

  it('avisa qué falta, qué se creará y por qué no se puede', () => {
    expect(vistaAmenidad(formulario(), CATALOGO, [])).toMatchObject({
      valido: false,
      texto: 'Elige un tipo del catálogo.',
    });
    expect(vistaAmenidad(formulario({ origen: 'propia' }), CATALOGO, [])).toMatchObject({
      valido: false,
      texto: 'Escribe el nombre de la amenidad.',
    });

    const unica = vistaAmenidad(formulario({ tipoId: 1 }), CATALOGO, []);
    expect(unica).toMatchObject({ valido: true, tono: 'exito' });
    expect(unica.texto).toContain('Después configura horarios y cobro en Áreas comunes.');

    const varias = vistaAmenidad(formulario({ tipoId: 1, cantidad: 2 }), CATALOGO, []);
    expect(varias).toMatchObject({ valido: true, tono: 'info' });
    expect(varias.texto).toBe(
      'Se crearán 2 registros para reservarlos por separado: Área BBQ 1, Área BBQ 2.',
    );

    const propia = vistaAmenidad(
      formulario({ origen: 'propia', nombre: 'Huerto', reservable: false }),
      CATALOGO,
      [],
    );
    expect(propia.texto).toBe('Se creará: Huerto. Solo tu condominio la verá.');

    const delCatalogo = vistaAmenidad(
      formulario({ origen: 'propia', nombre: 'área bbq' }),
      CATALOGO,
      [],
    );
    expect(delCatalogo).toMatchObject({ valido: false, tono: 'error' });
    expect(delCatalogo.texto).toContain('ya existe en el catálogo');

    const repetida = vistaAmenidad(
      formulario({ origen: 'propia', nombre: 'Piscina propia' }),
      CATALOGO,
      [amenidad({ nombre: 'piscina propia' })],
    );
    expect(repetida).toMatchObject({ valido: false, tono: 'error' });
    expect(repetida.texto).toBe('Ya hay una amenidad con ese nombre: Piscina propia.');
  });

  it('arma la petición según el origen', () => {
    expect(
      peticionAmenidad(formulario({ tipoId: 1, cantidad: 2, ubicacion: ' Torre A ' })),
    ).toEqual({
      origen: 'catalogo',
      amenidad_catalogo_id: 1,
      cantidad: 2,
      ubicacion: 'Torre A',
    });
    expect(
      peticionAmenidad(
        formulario({
          origen: 'propia',
          nombre: ' Muelle ',
          categoria: 'deporte',
          reservable: false,
          ubicacion: '',
        }),
      ),
    ).toEqual({
      origen: 'propia',
      nombre: 'Muelle',
      categoria: 'deporte',
      reservable: false,
      cantidad: 1,
      ubicacion: null,
    });
  });

  it('sugiere el área social y los bloques como ubicaciones', () => {
    expect(ubicacionesSugeridas(['Torre A', 'Torre B'])).toEqual([
      'Área social',
      'Torre A',
      'Torre B',
    ]);
  });
});

describe('ubicación de una amenidad', () => {
  it('acepta hasta 80 caracteres y vacía', () => {
    expect(errorUbicacion('Torre A · PB')).toBeNull();
    expect(errorUbicacion('   ')).toBeNull();
    expect(errorUbicacion('a'.repeat(80))).toBeNull();
    expect(errorUbicacion('a'.repeat(81))).toBe('La ubicación tiene máximo 80 caracteres.');
  });

  it('al guardar recorta y un texto vacío quita la ubicación', () => {
    expect(ubicacionParaGuardar('  Torre A  ')).toBe('Torre A');
    expect(ubicacionParaGuardar('   ')).toBeNull();
  });
});

describe('fotos de una amenidad', () => {
  const jpg = { type: 'image/jpeg', size: 1024 };

  it('acepta JPG y PNG de hasta 5 MB', () => {
    expect(errorFoto(jpg, 0)).toBeNull();
    expect(errorFoto({ type: 'image/png', size: 5 * 1024 * 1024 }, 4)).toBeNull();
  });

  it('rechaza otros formatos, las muy pesadas y pasar de cinco', () => {
    expect(errorFoto({ type: 'image/svg+xml', size: 10 }, 0)).toBe('La foto debe ser JPG o PNG.');
    expect(errorFoto({ type: 'application/pdf', size: 10 }, 0)).toBe('La foto debe ser JPG o PNG.');
    expect(errorFoto({ type: 'image/jpeg', size: 5 * 1024 * 1024 + 1 }, 0)).toBe(
      'La foto pesa más de 5 MB.',
    );
    expect(errorFoto(jpg, 5)).toBe('Una amenidad tiene hasta 5 fotos. Quita una para subir otra.');
  });

  it('mueve una foto una posición y no pasa de los extremos', () => {
    expect(moverFoto([1, 2, 3], 2, -1)).toEqual([2, 1, 3]);
    expect(moverFoto([1, 2, 3], 2, 1)).toEqual([1, 3, 2]);
    expect(moverFoto([1, 2, 3], 1, -1)).toEqual([1, 2, 3]);
    expect(moverFoto([1, 2, 3], 3, 1)).toEqual([1, 2, 3]);
    expect(moverFoto([1, 2, 3], 9, 1)).toEqual([1, 2, 3]);
  });
});

describe('servicio de fotos', () => {
  it('sube como multipart, quita y ordena en sus rutas', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: {} } });
    const del = vi.spyOn(api, 'delete').mockResolvedValue({ data: { data: {} } });
    const put = vi.spyOn(api, 'put').mockResolvedValue({ data: { data: {} } });

    const archivo = new File(['x'], 'piscina.jpg', { type: 'image/jpeg' });
    await amenidadesService.subirFoto(4, archivo);
    await amenidadesService.quitarFoto(4, 9);
    await amenidadesService.ordenarFotos(4, [3, 1, 2]);

    const [ruta, formulario] = post.mock.calls[0] as [string, FormData];
    expect(ruta).toBe('/amenidades/4/fotos');
    expect((formulario.get('foto') as File).name).toBe('piscina.jpg');
    expect(del).toHaveBeenCalledWith('/amenidades/4/fotos/9');
    expect(put).toHaveBeenCalledWith('/amenidades/4/fotos/orden', { ids: [3, 1, 2] });
  });
});
