import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import { clavesMorosidad } from '../composables/useMorosidad';
import {
  convenioVacio,
  detalleDeuda,
  textoRecordatorios,
  textoRestriccion,
  textoSituacion,
  validarConvenio,
} from '../morosidad.logica';
import { morosidadService, type UnidadMorosa } from '../services/morosidad.service';

afterEach(() => vi.restoreAllMocks());

const unidad = (u: Partial<UnidadMorosa>): UnidadMorosa =>
  ({ cuotas_vencidas: 4, dias_atraso: 126, situacion: { tipo: 'ninguna' }, ...u }) as UnidadMorosa;

describe('morosidad', () => {
  it('las claves de caché incluyen el condominio', () => {
    const f = { filtro: 'todas', buscar: ' c ', pagina: 1 } as const;
    expect(clavesMorosidad.lista(7, f)).toEqual(['finanzas', 7, 'morosidad', 'todas', 'c', 1]);
    expect(clavesMorosidad.lista(8, f)).not.toEqual(clavesMorosidad.lista(7, f));
    expect(clavesMorosidad.convenios(7, 3)).toEqual(['finanzas', 7, 'convenios', 3]);
  });

  it('describe la situación y la deuda como en el mockup', () => {
    expect(textoSituacion({ tipo: 'restringida', desde: '2026-10-13' })).toMatchObject({
      texto: 'Restringido en áreas comunes',
      tono: 'error',
    });
    expect(textoSituacion({ tipo: 'notificada', restringe_desde: '2026-10-13' }).texto).toMatch(
      /^Notificado · restringe el 13 oct/,
    );
    expect(textoSituacion({ tipo: 'convenio', cuota: 3, de: 6, al_dia: true })).toMatchObject({
      texto: 'Convenio al día',
      tono: 'exito',
    });
    expect(textoSituacion({ tipo: 'convenio', cuota: 3, de: 6, al_dia: false }).tono).toBe(
      'alerta',
    );
    expect(textoSituacion({ tipo: 'ninguna' }).texto).toBe('Sin aviso');
    expect(detalleDeuda(unidad({}))).toBe('4 cuotas · 126 días');
    expect(detalleDeuda(unidad({ cuotas_vencidas: 1, dias_atraso: 1 }))).toBe('1 cuota · 1 día');
    expect(
      detalleDeuda(unidad({ situacion: { tipo: 'convenio', cuota: 3, de: 6, al_dia: true } })),
    ).toBe('Convenio 3 de 6');
    expect(textoRestriccion(3)).toBe('Desde 3 meses de deuda');
    expect(textoRestriccion(1)).toBe('Desde 1 mes de deuda');
  });

  it('resume el resultado de los recordatorios', () => {
    expect(textoRecordatorios({ enviados: 5, sin_correo: 0, ya_avisadas: 0 })).toBe(
      '5 recordatorios enviados.',
    );
    expect(textoRecordatorios({ enviados: 1, sin_correo: 2, ya_avisadas: 3 })).toBe(
      '1 recordatorio enviado · 2 sin correo registrado · 3 ya avisadas hoy.',
    );
  });

  it('valida el convenio: de 2 a 36 cuotas y primera cuota no pasada', () => {
    const hoy = '2026-10-17';
    expect(convenioVacio(hoy)).toEqual({ cuotas: '3', primeraCuotaEl: '2026-11-16' });
    expect(validarConvenio(convenioVacio(hoy), hoy)).toEqual({});
    expect(validarConvenio({ cuotas: '1', primeraCuotaEl: hoy }, hoy).cuotas).toBeDefined();
    expect(validarConvenio({ cuotas: '37', primeraCuotaEl: hoy }, hoy).cuotas).toBeDefined();
    expect(validarConvenio({ cuotas: 'x', primeraCuotaEl: hoy }, hoy).cuotas).toBeDefined();
    expect(
      validarConvenio({ cuotas: '3', primeraCuotaEl: '2026-10-01' }, hoy).primeraCuotaEl,
    ).toBeDefined();
    expect(validarConvenio({ cuotas: '3', primeraCuotaEl: '' }, hoy).primeraCuotaEl).toBeDefined();
  });

  it('usa las rutas del contrato', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({
      data: {
        data: [],
        meta: {
          resumen: {
            cartera_vencida: { saldo: '0.00', unidades: 0 },
            total_unidades: 0,
            tramos: [],
          },
          conteos: { todas: 0, en_mora: 0, restringidas: 0, convenio: 0 },
          reglas: { dias_gracia: 5, meses_restriccion: 3, dias_aviso_restriccion: 5 },
          pagination: { page: 1, per_page: 50, total: 0, last_page: 1 },
        },
      },
    });
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: {} } });
    await morosidadService.listar({ filtro: 'en_mora', buscar: ' a ', pagina: 2 });
    expect(get).toHaveBeenCalledWith('/finanzas/morosidad', {
      params: { filtro: 'en_mora', buscar: 'a', page: 2 },
    });
    await morosidadService.recordar(null);
    expect(post).toHaveBeenLastCalledWith('/finanzas/morosidad/recordatorios', {});
    await morosidadService.recordar([4, 5]);
    expect(post).toHaveBeenLastCalledWith('/finanzas/morosidad/recordatorios', {
      unidad_ids: [4, 5],
    });
    await morosidadService.crearConvenio(4, 3, '2026-11-01');
    expect(post).toHaveBeenLastCalledWith('/finanzas/convenios', {
      unidad_id: 4,
      cuotas: 3,
      primera_cuota_el: '2026-11-01',
    });
    await morosidadService.cancelarConvenio(9, 'Incumplió');
    expect(post).toHaveBeenLastCalledWith('/finanzas/convenios/9/cancelar', {
      motivo: 'Incumplió',
    });
    await morosidadService.levantarRestriccion(4, 'Acuerdo');
    expect(post).toHaveBeenLastCalledWith('/finanzas/morosidad/restricciones/4/levantar', {
      motivo: 'Acuerdo',
    });
  });

  it('rechaza una lista de morosidad sin resumen', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: { data: [], meta: {} } });
    await expect(
      morosidadService.listar({ filtro: 'todas', buscar: '', pagina: 1 }),
    ).rejects.toThrow();
  });
});
