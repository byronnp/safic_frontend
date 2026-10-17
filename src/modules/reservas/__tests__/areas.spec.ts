import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';
import { formatoMoneda } from '@/utils/formato';

import {
  formularioDeArea,
  hayCambiosArea,
  peticionArea,
  resumenArea,
  validarArea,
} from '../areas.logica';
import { clavesAreas } from '../composables/useAreas';
import { areasService, type AreaComun } from '../services/areas.service';

afterEach(() => vi.restoreAllMocks());

const salon: AreaComun = {
  id: 4,
  nombre: 'Salón comunal',
  ubicacion: 'Torre A',
  estado: 'disponible',
  requiere_aprobacion: true,
  restringible_por_mora: true,
  configurada: true,
  reglas: {
    abre: '08:00',
    cierra: '23:00',
    duracion_min_horas: 2,
    duracion_max_horas: 6,
    anticipacion_min_horas: 48,
    anticipacion_max_dias: 60,
    capacidad: 60,
    reservas_por_unidad_mes: 1,
    dias_semana: [1, 2, 3, 4, 5, 6, 7],
    costo: '50.00',
    garantia: '100.00',
    reglamento: 'Música hasta las 22:00.',
  },
};

describe('áreas comunes · reglas', () => {
  it('las claves de caché incluyen el condominio', () => {
    expect(clavesAreas.lista(3)).toEqual(['areas-comunes', 3, 'areas']);
    expect(clavesAreas.lista(3)).not.toEqual(clavesAreas.lista(4));
  });

  it('convierte el área a formulario y de vuelta sin perder nada', () => {
    const f = formularioDeArea(salon);
    expect(f.dias).toEqual([true, true, true, true, true, true, true]);
    expect(validarArea(f)).toEqual({});
    expect(peticionArea(f)).toEqual({
      ...salon.reglas,
      requiere_aprobacion: true,
      restringible_por_mora: true,
    });
    expect(hayCambiosArea(salon, f)).toBe(false);
    expect(hayCambiosArea(salon, { ...f, costo: '60.00' })).toBe(true);
  });

  it('capacidad y límite mensual vacíos viajan como null; los montos con coma se normalizan', () => {
    const f = { ...formularioDeArea(salon), capacidad: '', reservasPorMes: '', costo: '12,5' };
    const p = peticionArea(f);
    expect(p.capacidad).toBeNull();
    expect(p.reservas_por_unidad_mes).toBeNull();
    expect(p.costo).toBe('12.50');
  });

  it('valida horario, duraciones, días y montos', () => {
    const base = formularioDeArea(salon);
    expect(validarArea({ ...base, abre: '22:00', cierra: '10:00' }).cierra).toContain('posterior');
    expect(validarArea({ ...base, duracionMin: '5', duracionMax: '2' }).duracionMax).toContain(
      'no puede ser menor',
    );
    expect(validarArea({ ...base, dias: Array(7).fill(false) as boolean[] }).dias).toBe(
      'Elige al menos un día.',
    );
    expect(validarArea({ ...base, costo: 'abc' }).costo).toBeDefined();
    expect(validarArea({ ...base, duracionMin: '0' }).duracionMin).toBeDefined();
    expect(validarArea({ ...base, capacidad: '-3' }).capacidad).toBeDefined();
  });

  it('resume el costo y la aprobación como en la lista del mockup', () => {
    const plano = (t: string) => t.replace(/\s/g, ' ');
    expect(plano(resumenArea(salon))).toBe(
      plano(`${formatoMoneda('50.00')} + ${formatoMoneda('100.00')} garantía · con aprobación`),
    );
    const cancha: AreaComun = {
      ...salon,
      requiere_aprobacion: false,
      reglas: { ...salon.reglas, costo: '0.00', garantia: '0.00', duracion_max_horas: 2 },
    };
    expect(resumenArea(cancha)).toBe('Gratis · máx. 2 h · automática');
  });

  it('el servicio usa las rutas del contrato', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: [salon] } });
    const put = vi.spyOn(api, 'put').mockResolvedValue({ data: { data: salon } });

    expect(await areasService.listar()).toEqual([salon]);
    expect(get).toHaveBeenCalledWith('/areas-comunes/areas');

    const reglas = peticionArea(formularioDeArea(salon));
    await areasService.guardarReglas(4, reglas);
    expect(put).toHaveBeenCalledWith('/areas-comunes/areas/4/reglas', reglas);
  });
});
