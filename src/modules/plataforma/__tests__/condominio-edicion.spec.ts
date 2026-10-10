import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import { aCambios, formularioDeCondominio, validarPaso } from '../asistente';
import { validarMotivo } from '../condominio-edicion.logica';
import { plataformaService, type CondominioPlataforma } from '../services/plataforma.service';

afterEach(() => vi.restoreAllMocks());

const condominio = {
  id: 7,
  codigo: 'JV',
  nombre: 'Jardines del Valle',
  tipo: 'conjunto',
  ruc: '1790016919001',
  razon_social: 'Jardines S.A.',
  estado: 'activo',
  total_unidades: 130,
  valor_unidad: '1.50',
  plan: { codigo: 'profesional', nombre: 'Profesional' },
  ubicacion: {
    provincia_codigo: '17',
    canton_codigo: '1701',
    parroquia_codigo: '170150',
    direccion: 'Av. Principal 123',
    latitud: '-0.180653',
    longitud: '-78.467838',
  },
  contacto: { telefono: '0223456789', email: 'a@jv.ec' },
} as unknown as CondominioPlataforma;

describe('edición con la pantalla del asistente', () => {
  it('precarga el formulario con los datos del condominio', () => {
    const f = formularioDeCondominio(condominio);
    expect(f).toMatchObject({
      nombre: 'Jardines del Valle',
      provincia: '17',
      canton: '1701',
      parroquia: '170150',
      unidades: '130',
      plan: 'profesional',
      valorUnidad: '1.50',
      latitud: '-0.180653',
    });
    expect(validarPaso(1, f)).toEqual({});
    expect(validarPaso(2, f)).toEqual({});
  });

  it('sin cambios no envía nada', () => {
    expect(aCambios(condominio, formularioDeCondominio(condominio))).toEqual({});
  });

  it('envía solo lo que cambió: texto recortado, teléfono vacío como null, valor con dos decimales', () => {
    const f = {
      ...formularioDeCondominio(condominio),
      nombre: ' Valle Nuevo ',
      telefono: '',
      unidades: '140',
      valorUnidad: '2,5',
      parroquia: '170151',
      latitud: '-0.2',
    };
    expect(aCambios(condominio, f)).toEqual({
      nombre: 'Valle Nuevo',
      provincia_codigo: '17',
      canton_codigo: '1701',
      parroquia_codigo: '170151',
      telefono: null,
      total_unidades: 140,
      valor_unidad: '2.50',
      latitud: -0.2,
      longitud: -78.467838,
    });
  });

  it('el motivo para inactivar o reactivar es obligatorio', () => {
    expect(validarMotivo(' ')).toBe('Escribe el motivo.');
    expect(validarMotivo('no')).toBe('El motivo es muy corto.');
    expect(validarMotivo('Falta de pago')).toBeUndefined();
  });
});

describe('service de plataforma', () => {
  it('lee el detalle, edita, inactiva y reactiva en las rutas del contrato', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: {} } });
    const patch = vi.spyOn(api, 'patch').mockResolvedValue({ data: { data: {} } });
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: {} } });
    await plataformaService.condominio(7);
    expect(get).toHaveBeenCalledWith('/plataforma/condominios/7');
    await plataformaService.editar(7, { nombre: 'X Y' });
    expect(patch).toHaveBeenCalledWith('/plataforma/condominios/7', { nombre: 'X Y' });
    await plataformaService.inactivar(7, 'Falta de pago');
    expect(post).toHaveBeenLastCalledWith('/plataforma/condominios/7/inactivar', {
      motivo: 'Falta de pago',
    });
    await plataformaService.reactivar(7, 'Regularizó');
    expect(post).toHaveBeenLastCalledWith('/plataforma/condominios/7/reactivar', {
      motivo: 'Regularizó',
    });
  });
});
