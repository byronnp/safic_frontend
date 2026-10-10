import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';
import type { Usuario } from '@/core/api/types';
import { useSessionStore } from '@/stores/session';

import { clavesDatosCondominio } from '../composables/useDatosCondominio';
import {
  aparienciaDesde,
  esHexColor,
  generalDesde,
  motivoLogoInvalido,
  peticionApariencia,
  peticionGeneral,
  peticionUbicacion,
  ubicacionDesde,
  validarGeneral,
  validarUbicacion,
} from '../datos-condominio.logica';
import { condominioService, type DatosCondominio } from '../services/condominio.service';

const MARCA_VACIA = {
  color_primario: null,
  color_acento: null,
  logo_url: null,
  logo_claro_url: null,
  logo_oscuro_url: null,
};

function datos(cambios: Partial<DatosCondominio> = {}): DatosCondominio {
  return {
    id: 7,
    codigo: 'SF-0007',
    nombre: 'Conjunto Jardines del Valle',
    tipo: 'conjunto',
    ruc: '1792345678001',
    razon_social: 'Jardines SA',
    telefono: '022334455',
    email_contacto: 'admin@jardines.ec',
    direccion: 'Av. Ilaló',
    provincia: { codigo: '17', nombre: 'Pichincha' },
    canton: { codigo: '1701', nombre: 'Quito' },
    parroquia: { codigo: '170156', nombre: 'Iñaquito' },
    latitud: '-0.180000',
    longitud: '-78.470000',
    marca: MARCA_VACIA,
    ...cambios,
  };
}

beforeEach(() => setActivePinia(createPinia()));
afterEach(() => vi.restoreAllMocks());

describe('servicio de datos del condominio', () => {
  it('consulta y edita en /condominio', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: datos() } });
    const patch = vi.spyOn(api, 'patch').mockResolvedValue({ data: { data: datos() } });

    expect((await condominioService.ver()).codigo).toBe('SF-0007');
    expect(get).toHaveBeenCalledWith('/condominio');

    await condominioService.actualizar({ nombre: 'Nuevo' });
    expect(patch).toHaveBeenCalledWith('/condominio', { nombre: 'Nuevo' });
  });

  it('sube el logo como formulario y lo quita por variante', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: datos() } });
    const borrar = vi.spyOn(api, 'delete').mockResolvedValue({ data: { data: datos() } });

    await condominioService.subirLogo('oscuro', new File(['x'], 'logo.png', { type: 'image/png' }));
    const [ruta, formulario] = post.mock.calls[0] as [string, FormData];
    expect(ruta).toBe('/condominio/logo/oscuro');
    expect(formulario.get('archivo')).toBeInstanceOf(File);

    await condominioService.quitarLogo('claro');
    expect(borrar).toHaveBeenCalledWith('/condominio/logo/claro');
  });

  it('la clave de caché incluye el condominio', () => {
    expect(clavesDatosCondominio.todos(3)).toEqual(['condominio', 3]);
    expect(clavesDatosCondominio.todos(4)).not.toEqual(clavesDatosCondominio.todos(3));
  });
});

describe('pestaña General', () => {
  it('parte de lo guardado y valida nombre, teléfono, correo y dirección', () => {
    const f = generalDesde(datos());
    expect(f).toEqual({
      nombre: 'Conjunto Jardines del Valle',
      telefono: '022334455',
      correo: 'admin@jardines.ec',
      direccion: 'Av. Ilaló',
    });
    expect(validarGeneral(f)).toEqual({});

    expect(validarGeneral({ ...f, nombre: ' ' }).nombre).toBe('Escribe el nombre del condominio.');
    expect(validarGeneral({ ...f, telefono: '12345' }).telefono).toContain('9 o 10 dígitos');
    expect(validarGeneral({ ...f, telefono: '' })).toEqual({});
    expect(validarGeneral({ ...f, telefono: '02 233 4455' })).toEqual({});
    expect(validarGeneral({ ...f, correo: 'no-es-correo' }).correo).toBe(
      'Escribe un correo válido.',
    );
    expect(validarGeneral({ ...f, correo: '' })).toEqual({});
    expect(validarGeneral({ ...f, direccion: '' }).direccion).toBe('Escribe la dirección.');
  });

  it('manda el teléfono sin espacios y los vacíos como null', () => {
    expect(
      peticionGeneral({
        nombre: ' Jardines ',
        telefono: '02 233-4455',
        correo: '',
        direccion: ' Av. Ilaló ',
      }),
    ).toEqual({
      nombre: 'Jardines',
      telefono: '022334455',
      email_contacto: null,
      direccion: 'Av. Ilaló',
    });
  });
});

describe('pestaña Ubicación', () => {
  it('parte de lo guardado y exige provincia, cantón, parroquia y dirección', () => {
    const f = ubicacionDesde(datos());
    expect(f).toMatchObject({
      provincia: '17',
      canton: '1701',
      parroquia: '170156',
      latitud: '-0.180000',
    });
    expect(validarUbicacion(f)).toEqual({});

    const vacio = ubicacionDesde(
      datos({ provincia: null, canton: null, parroquia: null, direccion: null }),
    );
    expect(Object.keys(validarUbicacion(vacio)).sort()).toEqual([
      'canton',
      'direccion',
      'parroquia',
      'provincia',
    ]);
  });

  it('las coordenadas van juntas y dentro de Ecuador', () => {
    const f = ubicacionDesde(datos());

    expect(validarUbicacion({ ...f, latitud: '', longitud: '' })).toEqual({});
    expect(validarUbicacion({ ...f, latitud: '', longitud: '-78.4' }).latitud).toBe(
      'Marca la ubicación en el mapa.',
    );
    expect(validarUbicacion({ ...f, latitud: '-0,18', longitud: '-78,47' })).toEqual({});
    expect(validarUbicacion({ ...f, latitud: '40.4', longitud: '-3.7' })).toEqual({
      latitud: 'La ubicación debe estar en Ecuador.',
      longitud: 'La ubicación debe estar en Ecuador.',
    });
  });

  it('manda coordenadas como número solo si hay pin', () => {
    const f = ubicacionDesde(datos());
    expect(peticionUbicacion({ ...f, latitud: '-0,18', longitud: '-78.47' })).toEqual({
      provincia_codigo: '17',
      canton_codigo: '1701',
      parroquia_codigo: '170156',
      direccion: 'Av. Ilaló',
      latitud: -0.18,
      longitud: -78.47,
    });
    expect(peticionUbicacion({ ...f, latitud: '', longitud: '' })).not.toHaveProperty('latitud');
  });
});

describe('pestaña Apariencia', () => {
  it('muestra los colores guardados o los de SAFIC', () => {
    expect(aparienciaDesde(datos())).toEqual({ primario: '#0E5E5B', acento: '#F0B35A' });
    expect(
      aparienciaDesde(
        datos({ marca: { ...MARCA_VACIA, color_primario: '#1F4C9A', color_acento: '#4FC3F7' } }),
      ),
    ).toEqual({ primario: '#1F4C9A', acento: '#4FC3F7' });
  });

  it('los colores de SAFIC se mandan como null (restablecer) y los demás en mayúscula', () => {
    expect(peticionApariencia('#0e5e5b', '#f0b35a')).toEqual({
      color_primario: null,
      color_acento: null,
    });
    expect(peticionApariencia('#1f4c9a', '#4fc3f7')).toEqual({
      color_primario: '#1F4C9A',
      color_acento: '#4FC3F7',
    });
  });

  it('valida el hex', () => {
    expect(esHexColor('#1F4C9A')).toBe(true);
    expect(esHexColor('1F4C9A')).toBe(false);
    expect(esHexColor('#12345')).toBe(false);
  });

  it('revisa el logo antes de subirlo: PNG de hasta 1 MB', () => {
    expect(motivoLogoInvalido({ name: 'logo.png', type: 'image/png', size: 500_000 })).toBeNull();
    expect(motivoLogoInvalido({ name: 'logo.svg', type: 'image/svg+xml', size: 1000 })).toBe(
      'El logo debe ser un PNG.',
    );
    expect(motivoLogoInvalido({ name: 'logo.jpg', type: 'image/jpeg', size: 1000 })).toBe(
      'El logo debe ser un PNG.',
    );
    expect(motivoLogoInvalido({ name: 'logo.png', type: 'image/png', size: 1_048_577 })).toBe(
      'El logo pesa más de 1 MB.',
    );
  });
});

describe('sesión', () => {
  it('refleja el nombre y la marca guardados en el condominio activo, sin tocar otros', () => {
    const session = useSessionStore();
    const condominio = (id: number, nombre: string) => ({
      id,
      codigo: `SF-000${id}`,
      nombre,
      es_principal: id === 1,
      estado: 'activo',
      marca: null,
    });
    session.usuario = {
      id: 1,
      nombre: 'Ana',
      email: 'ana@example.com',
      condominios: [condominio(1, 'Uno'), condominio(2, 'Dos')],
      doble_factor: { activo: false, obligatorio: false },
      plataforma: null,
    } satisfies Usuario;

    session.aplicarDatosCondominio(2, {
      nombre: 'Dos Nuevo',
      marca: { ...MARCA_VACIA, color_primario: '#1F4C9A' },
    });

    expect(session.usuario.condominios[1]).toMatchObject({
      nombre: 'Dos Nuevo',
      marca: { color_primario: '#1F4C9A' },
    });
    expect(session.usuario.condominios[0]).toMatchObject({ nombre: 'Uno', marca: null });
  });
});
