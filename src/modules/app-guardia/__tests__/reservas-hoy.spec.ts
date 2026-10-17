import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import { clavesReservasHoy } from '../composables/useReservasHoy';
import { accionDeReserva, textoHora, textoPago } from '../reservas-hoy.logica';
import { reservasHoyService } from '../services/reservas-hoy.service';

afterEach(() => vi.restoreAllMocks());

describe('reservas de hoy (guardia)', () => {
  it('las claves de caché incluyen el condominio', () => {
    expect(clavesReservasHoy.hoy(3)).toEqual(['reservas', 3, 'hoy']);
    expect(clavesReservasHoy.hoy(3)).not.toEqual(clavesReservasHoy.hoy(4));
  });

  it('dice cómo está pagada la reserva, como en el mockup', () => {
    const plano = (t: string) => t.replace(/\s/g, ' ');
    expect(textoPago({ costo: '0.00', garantia: '0.00' })).toBe('Gratis');
    expect(plano(textoPago({ costo: '15.00', garantia: '0.00' }))).toMatch(
      /^Uso \$ ?15,00 pagado$/,
    );
    expect(plano(textoPago({ costo: '50.00', garantia: '100.00' }))).toMatch(
      /^Uso \$ ?50,00 y garantía \$ ?100,00 pagados$/,
    );
    expect(textoHora({ inicio: '12:00', fin: '16:00' })).toBe('12:00–16:00');
  });

  it('decide qué puede hacer el guardia: ingreso, recibir o nada (y bloquea a la unidad en mora)', () => {
    expect(accionDeReserva({ estado: 'confirmada', restringida: false })).toBe('ingreso');
    expect(accionDeReserva({ estado: 'confirmada', restringida: true })).toBe('bloqueada');
    expect(accionDeReserva({ estado: 'en_uso', restringida: false })).toBe('recibir');
    expect(accionDeReserva({ estado: 'finalizada', restringida: false })).toBeNull();
  });

  it('el servicio usa las rutas del contrato', async () => {
    const get = vi
      .spyOn(api, 'get')
      .mockResolvedValue({ data: { data: { fecha: '2026-10-17', reservas: [] } } });
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: {} });

    expect((await reservasHoyService.hoy()).fecha).toBe('2026-10-17');
    expect(get).toHaveBeenCalledWith('/garita/reservas-hoy');

    await reservasHoyService.ingreso(8);
    expect(post).toHaveBeenCalledWith('/garita/reservas/8/ingreso');

    await reservasHoyService.entrega(8, 'Silla rota');
    expect(post).toHaveBeenCalledWith('/garita/reservas/8/entrega', { danos: 'Silla rota' });
    await reservasHoyService.entrega(8, null);
    expect(post).toHaveBeenCalledWith('/garita/reservas/8/entrega', { danos: null });
  });
});
