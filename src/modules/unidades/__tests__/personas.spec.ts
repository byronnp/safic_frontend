import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import { clavesPersonas } from '../composables/usePersonas';
import { personaVacia, textoRelacion, validarPersona } from '../persona.formulario';
import { personasService } from '../services/personas.service';
import { unidadesService } from '../services/unidades.service';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('servicios de personas y ocupantes', () => {
  it('busca personas por nombre o documento', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: [] } });

    await personasService.listar({ buscar: ' paredes ', porPagina: 20 });

    expect(get).toHaveBeenCalledWith('/personas', {
      params: { buscar: 'paredes', page: 1, por_pagina: 20 },
    });
  });

  it('da acceso a la app a una persona con su ruta y devuelve si se envió la invitación', async () => {
    const post = vi
      .spyOn(api, 'post')
      .mockResolvedValue({ data: { data: { persona_id: 9, invitacion_enviada: true } } });

    await expect(personasService.darAcceso(9)).resolves.toEqual({
      persona_id: 9,
      invitacion_enviada: true,
    });
    expect(post).toHaveBeenCalledWith('/personas/9/acceso');
  });

  it('ve la unidad, su historial, asigna y finaliza en sus rutas', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: [] } });
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: { id: 3 } } });
    const patch = vi.spyOn(api, 'patch').mockResolvedValue({ data: { data: { id: 3 } } });

    await unidadesService.ver(7);
    await unidadesService.historialOcupantes(7);
    const datos = {
      persona_id: 2,
      relacion: 'inquilino' as const,
      es_principal: true,
      fecha_inicio: '2026-10-01',
      fecha_fin: null,
    };
    await unidadesService.asignarOcupante(7, datos);
    await unidadesService.finalizarOcupante(3, '2026-11-30');

    expect(get).toHaveBeenNthCalledWith(1, '/unidades/7');
    expect(get).toHaveBeenNthCalledWith(2, '/unidades/7/ocupantes');
    expect(post).toHaveBeenCalledWith('/unidades/7/ocupantes', datos);
    expect(patch).toHaveBeenCalledWith('/ocupantes/3/finalizar', { fecha_fin: '2026-11-30' });
  });

  it('las claves de personas incluyen el condominio', () => {
    expect(clavesPersonas.todas(5)).toEqual(['personas', 5]);
    expect(clavesPersonas.busqueda(5, 'ana')).toEqual(['personas', 5, 'busqueda', 'ana']);
  });
});

describe('formulario de persona', () => {
  const valida = {
    ...personaVacia(),
    documento: '1710034065', // cédula ficticia: solo cumple el módulo 10
    nombres: ' Lucía ',
    apellidos: 'Paredes',
    telefono: '099 123 4534',
    email: ' Lucia@Correo.EC ',
  };

  it('normaliza los datos antes de enviar', () => {
    expect(validarPersona(valida)).toEqual({
      ok: true,
      datos: {
        tipo_documento: 'cedula',
        documento: '1710034065', // cédula ficticia: solo cumple el módulo 10
        nombres: 'Lucía',
        apellidos: 'Paredes',
        telefono: '0991234534',
        email: 'lucia@correo.ec',
      },
    });
  });

  it('valida la cédula, el pasaporte y el celular', () => {
    const r = validarPersona({ ...valida, documento: '1710034066', telefono: '022345678' });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errores.documento).toBe('La cédula no es válida.');
      expect(r.errores.telefono).toBe('El celular tiene 10 dígitos y empieza con 09.');
    }

    expect(
      validarPersona({ ...valida, tipoDocumento: 'pasaporte', documento: 'AB123456' }).ok,
    ).toBe(true);
    expect(validarPersona({ ...valida, tipoDocumento: 'pasaporte', documento: 'A1' }).ok).toBe(
      false,
    );
  });

  it('el correo es opcional', () => {
    const r = validarPersona({ ...valida, email: '' });
    expect(r.ok && r.datos.email).toBeNull();
  });
});

it('nombra las relaciones en español', () => {
  expect(textoRelacion('contacto_emergencia')).toBe('Contacto de emergencia');
  expect(textoRelacion('inquilino')).toBe('Inquilino');
});
