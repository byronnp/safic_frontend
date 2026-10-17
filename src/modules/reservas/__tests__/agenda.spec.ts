import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import {
  armarGrilla,
  diasDeSemana,
  lunesDe,
  metaDeArea,
  resumenCobro,
  tituloSemana,
  venceEn,
} from '../agenda.logica';
import { validarBloqueo } from '../bloqueo.logica';
import { clavesAgenda } from '../composables/useAgenda';
import { agendaService, type Agenda, type AreaAgenda } from '../services/agenda.service';

afterEach(() => vi.restoreAllMocks());

const salon: AreaAgenda = {
  id: 4,
  nombre: 'Salón comunal',
  capacidad: 60,
  costo: '50.00',
  garantia: '100.00',
  duracion_max_horas: 6,
  configurada: true,
  en_mantenimiento: false,
};

describe('agenda de reservas', () => {
  it('las claves de caché incluyen el condominio', () => {
    expect(clavesAgenda.agenda(3, '2026-10-12')).toEqual(['reservas', 3, 'agenda', '2026-10-12']);
    expect(clavesAgenda.solicitudes(3)).not.toEqual(clavesAgenda.solicitudes(4));
  });

  it('encuentra el lunes de la semana y arma sus siete días', () => {
    expect(lunesDe('2026-10-17')).toBe('2026-10-12'); // sábado
    expect(lunesDe('2026-10-12')).toBe('2026-10-12'); // lunes
    expect(lunesDe('2026-10-18')).toBe('2026-10-12'); // domingo
    const dias = diasDeSemana('2026-10-12');
    expect(dias.map((d) => d.dow)).toEqual(['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']);
    expect(dias.map((d) => d.num)).toEqual([12, 13, 14, 15, 16, 17, 18]);
    expect(tituloSemana('2026-10-12')).toBe('Semana del 12 oct al 18 oct');
  });

  it('describe cada área como en el mockup', () => {
    const plano = (t: string) => t.replace(/\s/g, ' ');
    expect(plano(metaDeArea(salon))).toContain('60 pers. · ');
    expect(plano(metaDeArea(salon))).toContain('garantía');
    expect(
      metaDeArea({
        ...salon,
        capacidad: null,
        costo: '0.00',
        garantia: '0.00',
        duracion_max_horas: 2,
      }),
    ).toBe('Gratis · máx. 2 h');
  });

  it('arma la grilla: reservas y bloqueos por área y día, ordenados por hora', () => {
    const agenda: Agenda = {
      desde: '2026-10-12',
      hasta: '2026-10-18',
      areas: [salon],
      reservas: [
        {
          id: 1,
          amenidad_id: 4,
          unidad: 'A-201',
          fecha: '2026-10-17',
          inicio: '18:00',
          fin: '22:00',
          estado: 'confirmada',
        },
        {
          id: 2,
          amenidad_id: 4,
          unidad: 'B-112',
          fecha: '2026-10-17',
          inicio: '10:00',
          fin: '12:00',
          estado: 'pendiente',
        },
        {
          id: 3,
          amenidad_id: 9,
          unidad: 'Z-1',
          fecha: '2026-10-17',
          inicio: '10:00',
          fin: '12:00',
          estado: 'confirmada',
        },
      ],
      bloqueos: [
        {
          id: 7,
          amenidad_id: 4,
          fecha: '2026-10-14',
          inicio: null,
          fin: null,
          motivo: 'Mantenimiento',
        },
      ],
    };
    const [fila] = armarGrilla(agenda, diasDeSemana('2026-10-12'));
    expect(fila?.celdas[2]?.map((i) => [i.tipo, i.hora])).toEqual([['blk', 'Todo el día']]);
    expect(fila?.celdas[5]?.map((i) => [i.clave, i.tipo, i.texto])).toEqual([
      ['r2', 'pend', 'B-112 · por aprobar'],
      ['r1', 'ok', 'A-201'],
    ]);
    expect(fila?.celdas[0]).toEqual([]);
  });

  it('calcula cuándo vence una solicitud y qué se cobra al aprobar', () => {
    const ahora = new Date('2026-10-12T10:00:00Z').getTime();
    expect(venceEn('2026-10-13T06:00:00Z', ahora)).toBe('Vence en 20 h');
    expect(venceEn('2026-10-12T09:00:00Z', ahora)).toBe('Vence pronto');
    const plano = (t: string) => t.replace(/\s/g, ' ');
    expect(plano(resumenCobro({ costo: '50.00', garantia: '100.00' }))).toContain('garantía');
    expect(resumenCobro({ costo: '0.00', garantia: '0.00' })).toBe('');
  });

  it('valida el bloqueo: área, fecha, horas y motivo', () => {
    const base = {
      areaId: 4,
      fecha: '2026-10-20',
      todoElDia: true,
      inicio: '',
      fin: '',
      motivo: 'Mantenimiento',
    };
    expect(validarBloqueo(base, '2026-10-17')).toEqual({});
    expect(validarBloqueo({ ...base, areaId: null }, '2026-10-17').areaId).toBeDefined();
    expect(validarBloqueo({ ...base, fecha: '2026-10-10' }, '2026-10-17').fecha).toContain(
      'ya pasó',
    );
    expect(validarBloqueo({ ...base, motivo: 'ab' }, '2026-10-17').motivo).toBeDefined();
    expect(
      validarBloqueo({ ...base, todoElDia: false, inicio: '12:00', fin: '10:00' }, '2026-10-17')
        .fin,
    ).toContain('posterior');
    expect(
      validarBloqueo({ ...base, todoElDia: false, inicio: '10:00', fin: '12:00' }, '2026-10-17'),
    ).toEqual({});
  });

  it('el servicio usa las rutas del contrato', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: [] } });
    const post = vi
      .spyOn(api, 'post')
      .mockResolvedValue({ data: { data: { id: 1, reservas_canceladas: 2 } } });
    const del = vi.spyOn(api, 'delete').mockResolvedValue({ data: {} });

    await agendaService.agenda('2026-10-12', 7);
    expect(get).toHaveBeenCalledWith('/areas-comunes/agenda', {
      params: { desde: '2026-10-12', dias: 7 },
    });
    await agendaService.solicitudes();
    expect(get).toHaveBeenCalledWith('/areas-comunes/solicitudes');

    await agendaService.aprobar(5);
    expect(post).toHaveBeenCalledWith('/areas-comunes/reservas/5/aprobar');
    await agendaService.rechazar(5, 'No hay lugar');
    expect(post).toHaveBeenCalledWith('/areas-comunes/reservas/5/rechazar', {
      motivo: 'No hay lugar',
    });
    await agendaService.cancelar(5, 'Asamblea');
    expect(post).toHaveBeenCalledWith('/areas-comunes/reservas/5/cancelar', { motivo: 'Asamblea' });

    const bloqueo = {
      amenidad_id: 4,
      fecha: '2026-10-20',
      inicio: null,
      fin: null,
      motivo: 'Mantenimiento',
      cancelar_reservas: true,
    };
    expect(await agendaService.bloquear(bloqueo)).toEqual({ reservasCanceladas: 2 });
    expect(post).toHaveBeenCalledWith('/areas-comunes/bloqueos', bloqueo);

    await agendaService.desbloquear(7);
    expect(del).toHaveBeenCalledWith('/areas-comunes/bloqueos/7');
  });
});
