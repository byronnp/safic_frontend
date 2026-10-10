import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import {
  cambiosDe,
  formularioDe,
  validarEdicion,
  validarMotivo,
  valorNormalizado,
} from '../condominio-edicion.logica';
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
  ubicacion: { direccion: 'Av. Principal 123' },
  contacto: { telefono: '0223456789', email: 'a@jv.ec' },
} as unknown as CondominioPlataforma;

describe('edición de condominio', () => {
  it('sin cambios no envía nada', () => {
    expect(cambiosDe(condominio, formularioDe(condominio))).toEqual({});
  });

  it('envía solo lo que cambió, con teléfono vacío como null y valor con dos decimales', () => {
    const f = {
      ...formularioDe(condominio),
      nombre: ' Valle Nuevo ',
      telefono: '',
      total_unidades: '140',
      valor_unidad: '2,5',
    };
    expect(cambiosDe(condominio, f)).toEqual({
      nombre: 'Valle Nuevo',
      telefono: null,
      total_unidades: 140,
      valor_unidad: '2.50',
    });
  });

  it('valida RUC, teléfono, correo, unidades y valor', () => {
    expect(validarEdicion(formularioDe(condominio))).toEqual({});
    const e = validarEdicion({
      ...formularioDe(condominio),
      nombre: '',
      ruc: '123',
      telefono: '123',
      email_contacto: 'mal',
      total_unidades: '0',
      plan_codigo: null,
      valor_unidad: '0',
    });
    expect(Object.keys(e).sort()).toEqual([
      'email_contacto',
      'nombre',
      'plan_codigo',
      'ruc',
      'telefono',
      'total_unidades',
      'valor_unidad',
    ]);
    expect(valorNormalizado('1,5')).toBe('1.50');
    expect(valorNormalizado('abc')).toBe('');
  });

  it('el motivo es obligatorio', () => {
    expect(validarMotivo(' ')).toBe('Escribe el motivo.');
    expect(validarMotivo('no')).toBe('El motivo es muy corto.');
    expect(validarMotivo('Falta de pago')).toBeUndefined();
  });
});

describe('service de plataforma', () => {
  it('edita, inactiva y reactiva en las rutas del contrato', async () => {
    const patch = vi.spyOn(api, 'patch').mockResolvedValue({ data: { data: {} } });
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: {} } });
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
