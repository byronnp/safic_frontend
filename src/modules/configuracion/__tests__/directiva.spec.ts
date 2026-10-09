import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import { clavesDirectiva } from '../composables/useDirectiva';
import {
  ESTADOS_CARGO,
  inicialesPersona,
  mensajeNombramiento,
  motivoCandidato,
  periodoPorOmision,
  peticionCargo,
  textoPeriodo,
  validarCargo,
} from '../directiva.logica';
import {
  directivaService,
  type CandidatoDirectiva,
  type CargoDirectiva,
} from '../services/directiva.service';

afterEach(() => vi.restoreAllMocks());

const HOY = '2026-10-09';

function cargo(cambios: Partial<CargoDirectiva> = {}): CargoDirectiva {
  return {
    cargo: 'presidente',
    etiqueta: 'Presidente',
    estado: 'vigente',
    titular: {
      persona_id: 4,
      nombre: 'Fernando Salazar',
      unidad: 'C-12',
      sigue_siendo_propietario: true,
    },
    periodo_inicio: '2026-03-15',
    periodo_fin: '2027-03-15',
    acta: 'Acta 2026-01',
    ...cambios,
  };
}

function candidato(cambios: Partial<CandidatoDirectiva> = {}): CandidatoDirectiva {
  return {
    persona_id: 9,
    nombre: 'Paola Cedeño',
    unidad: 'B-201',
    disponible: true,
    motivo: null,
    cargo_actual: null,
    ...cambios,
  };
}

describe('servicio de la directiva', () => {
  it('consulta cargos y candidatos y nombra en sus rutas', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: [cargo()] } });
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: cargo() } });

    expect((await directivaService.ver())[0]?.cargo).toBe('presidente');
    expect(get).toHaveBeenCalledWith('/directiva');

    await directivaService.candidatos('tesorero');
    expect(get).toHaveBeenLastCalledWith('/directiva/tesorero/candidatos');

    const datos = { persona_id: 9, acta: 'Acta 2026-03', periodo_hasta: '2027-10-09' };
    await directivaService.asignar('presidente', datos);
    expect(post).toHaveBeenCalledWith('/directiva/presidente', datos);
  });

  it('las claves de caché incluyen el condominio y el cargo', () => {
    expect(clavesDirectiva.todas(3)).toEqual(['directiva', 3]);
    expect(clavesDirectiva.candidatos(3, 'tesorero')).toEqual([
      'directiva',
      3,
      'candidatos',
      'tesorero',
    ]);
    expect(clavesDirectiva.todas(4)).not.toEqual(clavesDirectiva.todas(3));
  });
});

describe('textos de la directiva', () => {
  it('estados, periodo e iniciales', () => {
    expect(ESTADOS_CARGO.prorrogado.tono).toBe('alerta');
    expect(ESTADOS_CARGO.vacante.texto).toBe('Vacante');
    expect(textoPeriodo(cargo())).toBe('15 mar 2026 – 15 mar 2027');
    expect(textoPeriodo(cargo({ periodo_inicio: null, periodo_fin: null }))).toBe('—');
    expect(inicialesPersona('Fernando Salazar')).toBe('FS');
    expect(periodoPorOmision('2026-10-09')).toBe('2027-10-09');
  });

  it('explica por qué un candidato no está disponible', () => {
    expect(motivoCandidato(candidato())).toEqual({ texto: 'Disponible', tono: 'exito' });
    expect(
      motivoCandidato(
        candidato({ disponible: false, motivo: 'ocupa_cargo', cargo_actual: 'tesorero' }),
      ),
    ).toEqual({
      texto: 'Ya es tesorero',
      tono: 'error',
    });
    expect(motivoCandidato(candidato({ disponible: false, motivo: 'sin_correo' }))).toEqual({
      texto: 'Sin correo',
      tono: 'error',
    });
  });

  it('el mensaje de nombramiento aclara que el anterior conserva sus perfiles', () => {
    const nuevo = cargo({
      titular: {
        persona_id: 9,
        nombre: 'Paola Cedeño',
        unidad: 'B-201',
        sigue_siendo_propietario: true,
      },
    });

    expect(mensajeNombramiento(nuevo, 'Fernando Salazar')).toBe(
      'Presidente: Paola Cedeño desde hoy. El periodo de Fernando Salazar se cerró y conserva sus demás perfiles, como residente.',
    );
    expect(mensajeNombramiento(nuevo, null)).toBe('Presidente: Paola Cedeño desde hoy.');
  });
});

describe('formulario del cargo', () => {
  const valido = { personaId: 9, acta: 'Acta 2026-03', hasta: '2027-10-09' };

  it('pide persona, acta y un periodo entre mañana y 4 años', () => {
    expect(validarCargo(valido, HOY)).toEqual({});
    expect(validarCargo({ ...valido, personaId: null }, HOY).personaId).toBe('Elige a la persona.');
    expect(validarCargo({ ...valido, acta: '  ' }, HOY).acta).toContain('Escribe el acta');
    expect(validarCargo({ ...valido, acta: 'a'.repeat(81) }, HOY).acta).toContain('máximo 80');
    expect(validarCargo({ ...valido, hasta: '' }, HOY).hasta).toContain('Elige hasta cuándo');
    expect(validarCargo({ ...valido, hasta: HOY }, HOY).hasta).toContain('después de hoy');
    expect(validarCargo({ ...valido, hasta: '2030-10-09' }, HOY)).toEqual({});
    expect(validarCargo({ ...valido, hasta: '2030-10-10' }, HOY).hasta).toContain('4 años');
  });

  it('arma la petición', () => {
    expect(peticionCargo({ personaId: 9, acta: ' Acta 2026-03 ', hasta: '2027-10-09' })).toEqual({
      persona_id: 9,
      acta: 'Acta 2026-03',
      periodo_hasta: '2027-10-09',
    });
  });
});
