import { describe, expect, it } from 'vitest';

import {
  aplicarResultado,
  colaVacia,
  conSalida,
  copiaVigente,
  dentroLocal,
  enZona,
  ingresoConQrLocal,
  validarLocal,
} from '../offline.logica';
import type { CopiaQr, QrDeCopia } from '../services/garita.service';

const qr = (extra: Partial<QrDeCopia> = {}): QrDeCopia => ({
  token: '1-abc',
  visitante: 'Juan Pérez',
  placa: 'PDQ-3321',
  unidad: 'A-102',
  autorizo: 'María',
  tipo: 'unica',
  fecha_desde: '2026-10-17',
  fecha_hasta: '2026-10-17',
  hora_desde: '08:00',
  hora_hasta: '20:00',
  dias_semana: null,
  ya_dentro: false,
  ...extra,
});
const copia = (...qrs: QrDeCopia[]): CopiaQr => ({
  generado_en: '2026-10-17T09:40:00-05:00',
  zona: 'America/Guayaquil',
  qrs,
});
// 2026-10-17 es sábado; 15:00 en Ecuador = 20:00 UTC
const MEDIODIA = Date.parse('2026-10-17T20:00:00Z');

describe('validarLocal', () => {
  it('acepta un QR vigente hoy dentro del horario', () => {
    const r = validarLocal('1-abc', copia(qr()), colaVacia(), MEDIODIA);
    expect(r?.valido).toBe(true);
    expect(r?.visita.visitante).toBe('Juan Pérez');
  });

  it('devuelve null si el QR no está en la copia', () => {
    expect(validarLocal('otro', copia(qr()), colaVacia(), MEDIODIA)).toBeNull();
    expect(validarLocal('1-abc', null, colaVacia(), MEDIODIA)).toBeNull();
  });

  it('rechaza fuera de horario, vencido y aún no vigente', () => {
    const noche = Date.parse('2026-10-18T03:00:00Z'); // 22:00 en Ecuador
    expect(validarLocal('1-abc', copia(qr()), colaVacia(), noche)?.motivo).toBe(
      'QR_FUERA_DE_HORARIO',
    );
    expect(
      validarLocal('1-abc', copia(qr({ fecha_hasta: '2026-10-16' })), colaVacia(), MEDIODIA)
        ?.motivo,
    ).toBe('QR_VENCIDO');
    expect(
      validarLocal(
        '1-abc',
        copia(qr({ fecha_desde: '2026-10-18', fecha_hasta: '2026-10-18' })),
        colaVacia(),
        MEDIODIA,
      )?.motivo,
    ).toBe('QR_AUN_NO_VIGENTE');
  });

  it('el QR recurrente respeta los días de la semana', () => {
    const lunes = qr({ tipo: 'recurrente', dias_semana: [1], fecha_hasta: '2026-12-31' });
    expect(validarLocal('1-abc', copia(lunes), colaVacia(), MEDIODIA)?.motivo).toBe(
      'QR_DIA_NO_HABILITADO',
    );
    const sabado = qr({ tipo: 'recurrente', dias_semana: [6], fecha_hasta: '2026-12-31' });
    expect(validarLocal('1-abc', copia(sabado), colaVacia(), MEDIODIA)?.valido).toBe(true);
  });

  it('un QR único usado sin conexión no se acepta dos veces', () => {
    const c = copia(qr());
    const cola = { ...colaVacia(), ingresos: [ingresoConQrLocal(qr(), MEDIODIA)] };
    expect(validarLocal('1-abc', c, cola, MEDIODIA)?.motivo).toBe('QR_YA_USADO');
  });

  it('una visita que ya está dentro no entra de nuevo; tras su salida local sí', () => {
    const r = qr({
      tipo: 'recurrente',
      dias_semana: [6],
      fecha_hasta: '2026-12-31',
      ya_dentro: true,
    });
    expect(validarLocal('1-abc', copia(r), colaVacia(), MEDIODIA)?.motivo).toBe('QR_YA_DENTRO');

    const libre = qr({ tipo: 'recurrente', dias_semana: [6], fecha_hasta: '2026-12-31' });
    const dentro = { ...colaVacia(), ingresos: [ingresoConQrLocal(libre, MEDIODIA)] };
    expect(validarLocal('1-abc', copia(libre), dentro, MEDIODIA)?.motivo).toBe('QR_YA_DENTRO');
    const salio = conSalida(dentro, { uuid: dentro.ingresos[0]!.uuid }, MEDIODIA);
    expect(validarLocal('1-abc', copia(libre), salio, MEDIODIA)?.valido).toBe(true);
  });
});

describe('cola local', () => {
  it('la salida de un ingreso local lo saca de «dentro»', () => {
    const cola = { ...colaVacia(), ingresos: [ingresoConQrLocal(qr(), MEDIODIA)] };
    expect(dentroLocal(cola)).toHaveLength(1);
    expect(dentroLocal(conSalida(cola, { uuid: cola.ingresos[0]!.uuid }, MEDIODIA))).toHaveLength(
      0,
    );
  });

  it('la salida de un acceso del servidor no se duplica', () => {
    const una = conSalida(colaVacia(), { accesoId: 7 }, MEDIODIA);
    expect(conSalida(una, { accesoId: 7 }, MEDIODIA).salidas).toHaveLength(1);
  });

  it('aplicarResultado vacía lo resuelto y resume conflictos y rechazos', () => {
    const a = ingresoConQrLocal(qr({ token: 'a', visitante: 'Ana' }), MEDIODIA);
    const b = ingresoConQrLocal(qr({ token: 'b', visitante: 'Beto' }), MEDIODIA);
    const c = ingresoConQrLocal(qr({ token: 'c', visitante: 'Carla' }), MEDIODIA);
    const { cola, resumen } = aplicarResultado(
      { ingresos: [a, b, c], salidas: [{ acceso_id: 9, salida_en: 'x' }] },
      {
        ingresos: [
          { uuid: a.uuid, resultado: 'ok' },
          { uuid: b.uuid, resultado: 'conflicto', motivo: 'QR ya usado' },
        ],
        salidas: [{ acceso_id: 9, resultado: 'rechazado', motivo: 'No existe' }],
      },
    );
    expect(cola.ingresos.map((i) => i.uuid)).toEqual([c.uuid]);
    expect(cola.salidas).toHaveLength(0);
    expect(resumen.conflictos).toEqual([{ nombre: 'Beto', motivo: 'QR ya usado' }]);
    expect(resumen.rechazados).toHaveLength(1);
  });
});

describe('copia y zona', () => {
  it('enZona usa la hora del condominio', () => {
    expect(enZona(MEDIODIA, 'America/Guayaquil')).toEqual({
      fecha: '2026-10-17',
      hora: '15:00',
      dia: 6,
    });
  });

  it('copiaVigente descarta los QR ya vencidos', () => {
    const c = copia(qr({ fecha_hasta: '2026-10-10' }), qr({ token: 'x' }));
    expect(copiaVigente(c, MEDIODIA)?.qrs.map((q) => q.token)).toEqual(['x']);
    expect(copiaVigente(null, MEDIODIA)).toBeNull();
  });
});
