import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import { clavesReservas } from '../composables/useReservas';
import {
  diaConLugar,
  debeAlgo,
  diaDeTira,
  estadoDeReserva,
  fechaCorta,
  iconoDeArea,
  limiteDePago,
  resumenAreaResidente,
  separarReservas,
  textoAprobacion,
  textoFranja,
} from '../reservas.logica';
import { reservasService, type AreaReservable, type MiReserva } from '../services/reservas.service';

afterEach(() => vi.restoreAllMocks());

const salon: AreaReservable = {
  id: 4,
  nombre: 'Salón comunal',
  ubicacion: null,
  estado: 'disponible',
  mantenimiento_hasta: null,
  requiere_aprobacion: true,
  capacidad: 60,
  duracion_min_horas: 2,
  duracion_max_horas: 6,
  costo: '50.00',
  garantia: '100.00',
  reglamento: null,
};
const reserva = (extra: Partial<MiReserva> = {}): MiReserva => ({
  id: 1,
  area: 'Salón comunal',
  unidad: 'A-102',
  fecha: '2026-10-17',
  inicio: '14:00',
  fin: '20:00',
  estado: 'confirmada',
  costo: '50.00',
  garantia: '100.00',
  proxima: true,
  puede_cancelar: true,
  por_pagar: '0.00',
  pagar_antes_de: null,
  motivo: null,
  ...extra,
});

describe('reservas del residente', () => {
  it('las claves de caché incluyen el condominio', () => {
    expect(clavesReservas.mias(3)).toEqual(['reservas', 3, 'mias']);
    expect(clavesReservas.disponibilidad(3, 4, '2026-10-17')).toEqual([
      'reservas',
      3,
      'disponibilidad',
      4,
      '2026-10-17',
    ]);
    expect(clavesReservas.mias(3)).not.toEqual(clavesReservas.mias(4));
  });

  it('describe el área como en el mockup', () => {
    const plano = (t: string) => t.replace(/\s/g, ' ');
    expect(plano(resumenAreaResidente(salon))).toContain('Hasta 60 personas');
    expect(plano(resumenAreaResidente(salon))).toContain('+ garantía');
    expect(
      resumenAreaResidente({ ...salon, capacidad: null, costo: '0.00', garantia: '0.00' }),
    ).toBe('Turnos de 2 horas · Sin costo');
    expect(textoAprobacion(salon)).toBe('Requiere aprobación');
    expect(textoAprobacion({ requiere_aprobacion: false })).toBe('Confirmación inmediata');
  });

  it('elige el ícono por el nombre del área', () => {
    expect(iconoDeArea('Área BBQ 1')).toBe('sym_r_outdoor_grill');
    expect(iconoDeArea('Piscina')).toBe('sym_r_pool');
    expect(iconoDeArea('Cancha múltiple')).toBe('sym_r_sports_tennis');
    expect(iconoDeArea('Terraza')).toBe('sym_r_event_available');
  });

  it('formatea fechas y franjas', () => {
    expect(textoFranja({ inicio: '10:00', fin: '12:00' })).toBe('10:00–12:00');
    expect(fechaCorta('2026-10-17')).toMatch(/^Sáb 17 oct/);
    expect(diaDeTira('2026-10-17')).toEqual({ semana: 'SÁB', numero: 17 });
  });

  it('un día sin franjas libres no se puede elegir', () => {
    const f = (estado: 'libre' | 'ocupada' | 'cerrada') => ({
      inicio: '08:00',
      fin: '10:00',
      estado,
    });
    expect(diaConLugar({ fecha: '2026-10-17', franjas: [f('ocupada'), f('libre')] })).toBe(true);
    expect(diaConLugar({ fecha: '2026-10-17', franjas: [f('ocupada'), f('cerrada')] })).toBe(false);
  });

  it('muestra «Finalizada» a una confirmada que ya pasó y separa próximas de historial', () => {
    expect(estadoDeReserva(reserva()).texto).toBe('Confirmada');
    expect(estadoDeReserva(reserva({ proxima: false })).texto).toBe('Finalizada');
    expect(estadoDeReserva(reserva({ estado: 'pendiente' })).texto).toBe('Pendiente de aprobación');
    const { proximas, historial } = separarReservas([
      reserva(),
      reserva({ id: 2, proxima: false }),
    ]);
    expect(proximas.map((r) => r.id)).toEqual([1]);
    expect(historial.map((r) => r.id)).toEqual([2]);
  });

  it('avisa que falta pagar y hasta cuándo', () => {
    const debe = reserva({ por_pagar: '150.00', pagar_antes_de: '2026-10-16T14:00' });
    expect(estadoDeReserva(debe)).toEqual({ texto: 'Confirmada · falta pagar', tono: 'alerta' });
    expect(debeAlgo(debe.por_pagar)).toBe(true);
    expect(debeAlgo('0.00')).toBe(false);
    expect(limiteDePago('2026-10-16T14:00')).toBe('vie 16 oct, 14:00');
    // Si ya pasó, es «Finalizada» aunque deba algo
    expect(estadoDeReserva({ ...debe, proxima: false }).texto).toBe('Finalizada');
  });

  it('el servicio usa las rutas del contrato', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: [] } });
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: reserva() } });

    await reservasService.areas();
    expect(get).toHaveBeenCalledWith('/mis-reservas/areas');

    await reservasService.disponibilidad(4, '2026-10-17', 7);
    expect(get).toHaveBeenCalledWith('/mis-reservas/areas/4/disponibilidad', {
      params: { desde: '2026-10-17', dias: 7 },
    });

    await reservasService.mias();
    expect(get).toHaveBeenCalledWith('/mis-reservas');

    const nueva = {
      amenidad_id: 4,
      unidad_id: 9,
      fecha: '2026-10-17',
      inicio: '14:00',
      horas: 2,
      acepta_reglamento: true,
    };
    await reservasService.reservar(nueva);
    expect(post).toHaveBeenCalledWith('/mis-reservas', nueva);

    await reservasService.cancelar(1, null);
    expect(post).toHaveBeenCalledWith('/mis-reservas/1/cancelar', { motivo: null });
  });
});
