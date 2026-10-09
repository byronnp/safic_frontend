import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import { clavesDirectorio } from '../composables/useDirectorio';
import {
  coincideCampo,
  enlaceTelefono,
  terminoValido,
  textoOcupante,
  tipoVisual,
} from '../directorio.logica';
import { directorioService, type DirectorioUnidad } from '../services/directorio.service';

const diego: DirectorioUnidad = {
  unidad: { id: 1, codigo: 'A-102', tipo: 'departamento', bloque: 'Torre A' },
  ocupantes: [{ nombre: 'Diego Mora', relacion: 'inquilino', telefono: '0983307710' }],
  vehiculos: [{ placa: 'PBC-4821', descripcion: 'Kia Sportage · Gris', coincide: true }],
};

beforeEach(() => setActivePinia(createPinia()));
afterEach(() => vi.restoreAllMocks());

describe('servicio del directorio', () => {
  it('consulta con el texto recortado y devuelve data.data', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: [diego] } });

    const resultado = await directorioService.buscar('  pbc 48 ');

    expect(get).toHaveBeenCalledWith('/garita/directorio', { params: { buscar: 'pbc 48' } });
    expect(resultado[0]?.unidad.codigo).toBe('A-102');
  });

  it('la clave de caché incluye el condominio y el texto', () => {
    expect(clavesDirectorio.busqueda(7, 'pbc')).toEqual(['garita', 'directorio', 7, 'pbc']);
    expect(clavesDirectorio.busqueda(8, 'pbc')).not.toEqual(clavesDirectorio.busqueda(7, 'pbc'));
  });
});

describe('búsqueda del directorio', () => {
  it('no consulta con menos de 2 letras o números', () => {
    for (const texto of ['', ' ', 'a', '--', ' % ']) {
      expect(terminoValido(texto)).toBe(false);
    }
    for (const texto of ['pb', 'A-1', ' 12 ', 'ñu']) {
      expect(terminoValido(texto)).toBe(true);
    }
  });

  it('filtra por el campo elegido, sin tildes, guiones ni mayúsculas', () => {
    expect(coincideCampo(diego, 'placa', 'pbc 4821')).toBe(true);
    expect(coincideCampo(diego, 'placa', 'diego')).toBe(false);
    expect(coincideCampo(diego, 'nombre', 'DIEGO')).toBe(true);
    expect(coincideCampo(diego, 'nombre', 'mora')).toBe(true);
    expect(coincideCampo(diego, 'unidad', 'a102')).toBe(true);
    expect(coincideCampo(diego, 'unidad', 'b-1')).toBe(false);
    expect(
      coincideCampo(
        { ...diego, ocupantes: [{ nombre: 'José Peña', relacion: 'propietario', telefono: null }] },
        'nombre',
        'jose pena',
      ),
    ).toBe(true);
  });

  it('arma la relación con el bloque y el enlace de llamada', () => {
    expect(textoOcupante(diego.ocupantes[0]!, 'Torre A')).toBe('Inquilino · Torre A');
    expect(textoOcupante(diego.ocupantes[0]!, null)).toBe('Inquilino');
    expect(enlaceTelefono('098 330-7710')).toBe('tel:0983307710');
    expect(enlaceTelefono('+593 98 330 7710')).toBe('tel:+593983307710');
    expect(tipoVisual('casa')).toBe('casa');
    expect(tipoVisual('departamento')).toBe('torre');
  });
});
