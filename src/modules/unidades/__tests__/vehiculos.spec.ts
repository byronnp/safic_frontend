import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import { unidadesService } from '../services/unidades.service';
import {
  descripcionVehiculo,
  normalizarPlaca,
  validarMascota,
  validarVehiculo,
} from '../vehiculo.formulario';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('placa ecuatoriana', () => {
  it.each([
    ['pba1234', 'PBA-1234'],
    ['PBA-1234', 'PBA-1234'],
    ['abc 123', 'ABC-123'],
    ['ia123b', 'IA-123B'],
  ])('%s → %s', (entrada, esperada) => {
    expect(normalizarPlaca(entrada)).toBe(esperada);
  });

  it.each(['PB-1234', 'PBAA-1234', '1234-PBA', 'PBA-12', ''])('rechaza %s', (entrada) => {
    expect(normalizarPlaca(entrada)).toBeNull();
  });
});

describe('formularios de vehículo y mascota', () => {
  it('normaliza la placa y deja en null lo vacío', () => {
    expect(
      validarVehiculo({ placa: 'pba 1234', tipo: 'auto', marca: ' Kia ', modelo: '', color: '' }),
    ).toEqual({
      ok: true,
      datos: { placa: 'PBA-1234', tipo: 'auto', marca: 'Kia', modelo: null, color: null },
    });
  });

  it('rechaza una placa inválida', () => {
    const r = validarVehiculo({ placa: 'PB-12', tipo: 'auto', marca: '', modelo: '', color: '' });
    expect(r.ok || r.errores.placa).toBe(
      'La placa no es válida (ej. PBA-1234 o una moto IA-123B).',
    );
  });

  it('exige el nombre de la mascota', () => {
    const r = validarMascota({ nombre: ' ', especie: 'perro', raza: '' });
    expect(r.ok || r.errores.nombre).toBe('Escribe el nombre de la mascota.');
    expect(validarMascota({ nombre: 'Luna', especie: 'gato', raza: '' })).toEqual({
      ok: true,
      datos: { nombre: 'Luna', especie: 'gato', raza: null },
    });
  });

  it('describe el vehículo con lo que tenga', () => {
    expect(descripcionVehiculo({ marca: 'Kia', modelo: 'Rio', color: 'Gris', tipo: 'auto' })).toBe(
      'Kia Rio · Gris',
    );
    expect(descripcionVehiculo({ marca: null, modelo: null, color: null, tipo: 'moto' })).toBe(
      'Moto',
    );
  });
});

it('el servicio usa las rutas del contrato', async () => {
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: { id: 1 } } });
  const patch = vi.spyOn(api, 'patch').mockResolvedValue({ data: { data: { id: 1 } } });
  const del = vi.spyOn(api, 'delete').mockResolvedValue({ data: null });
  const vehiculo = {
    placa: 'PBA-1234',
    tipo: 'auto' as const,
    marca: null,
    modelo: null,
    color: null,
  };
  const mascota = { nombre: 'Luna', especie: 'perro' as const, raza: null };

  await unidadesService.crearVehiculo(7, vehiculo);
  await unidadesService.editarVehiculo(3, vehiculo);
  await unidadesService.eliminarVehiculo(3);
  await unidadesService.crearMascota(7, mascota);
  await unidadesService.editarMascota(4, mascota);
  await unidadesService.eliminarMascota(4);

  expect(post).toHaveBeenNthCalledWith(1, '/unidades/7/vehiculos', vehiculo);
  expect(patch).toHaveBeenNthCalledWith(1, '/vehiculos/3', vehiculo);
  expect(del).toHaveBeenNthCalledWith(1, '/vehiculos/3');
  expect(post).toHaveBeenNthCalledWith(2, '/unidades/7/mascotas', mascota);
  expect(patch).toHaveBeenNthCalledWith(2, '/mascotas/4', mascota);
  expect(del).toHaveBeenNthCalledWith(2, '/mascotas/4');
});
