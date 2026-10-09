import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import {
  aPeticionCobro,
  avisoDatosFaltantes,
  esIgualACobro,
  fechaRegistro,
  formularioDesde,
  mesActual,
  mesesDisponibles,
  proyeccionCobro,
  textoCambio,
  textoMes,
  textoRegistro,
  textoVencimiento,
  validarCobro,
  type FormularioCobro,
} from '../cobro.formulario';
import { clavesCobro } from '../composables/useCobro';
import { cobroService, type CobroCuotas } from '../services/cobro.service';

afterEach(() => vi.restoreAllMocks());

const UNIDADES: CobroCuotas['unidades'] = {
  por_tipo: { departamento: 136, casa: 12, local: 0, parqueadero: 0, bodega: 0 },
  con_cupo: 148,
  suma_cuotas: '12615.00',
  sin_alicuota: 0,
  sin_cuota_mensual: 0,
};

function cobro(cambios: Partial<CobroCuotas> = {}): CobroCuotas {
  return {
    configurado: true,
    metodo: 'general',
    cuota_general: '80.00',
    presupuesto_mensual: null,
    valores_tipo: [],
    dia_vencimiento: 10,
    aplica_desde: '2026-11',
    unidades: UNIDADES,
    historial: [],
    ...cambios,
  };
}

const AHORA = new Date('2026-10-15T15:00:00Z');

function formulario(cambios: Partial<FormularioCobro> = {}): FormularioCobro {
  return { ...formularioDesde(cobro(), AHORA), ...cambios };
}

describe('servicio y clave de cobro', () => {
  it('consulta y guarda en /cobro y devuelve data.data', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: cobro() } });
    const put = vi.spyOn(api, 'put').mockResolvedValue({ data: { data: cobro() } });

    expect((await cobroService.ver()).metodo).toBe('general');
    expect(get).toHaveBeenCalledWith('/cobro');

    const peticion = aPeticionCobro(formulario());
    await cobroService.guardar(peticion);
    expect(put).toHaveBeenCalledWith('/cobro', peticion);
  });

  it('la clave de caché incluye el condominio', () => {
    expect(clavesCobro.todos(3)).toEqual(['cobro', 3]);
    expect(clavesCobro.todos(4)).not.toEqual(clavesCobro.todos(3));
  });
});

describe('meses y fechas', () => {
  it('ofrece los 12 meses desde el siguiente', () => {
    const meses = mesesDisponibles(AHORA);
    expect(meses).toHaveLength(12);
    expect(meses[0]).toEqual({ valor: '2026-11', etiqueta: 'Noviembre 2026' });
    expect(meses.at(-1)?.valor).toBe('2027-10');
    expect(mesesDisponibles(new Date('2026-12-20T15:00:00Z'))[0]?.valor).toBe('2027-01');
  });

  it('el mes actual es el de Ecuador, no el de UTC', () => {
    // 1 nov 03:00 UTC = 31 oct 22:00 en Guayaquil
    expect(mesActual(new Date('2026-11-01T03:00:00Z'))).toBe('2026-10');
  });

  it('escribe meses, vencimientos y fechas del historial', () => {
    expect(textoMes('2026-11')).toBe('noviembre 2026');
    expect(textoVencimiento(10, '2026-11')).toBe('10 nov 2026');
    expect(textoVencimiento(0, '2026-11')).toBe('30 nov 2026');
    expect(textoVencimiento(0, '2027-02')).toBe('28 feb 2027');
    expect(fechaRegistro('2026-09-16T02:00:00Z')).toBe('15 sept 2026'); // 21:00 del 15 en Guayaquil
  });
});

describe('formulario', () => {
  it('parte de lo guardado, con coma decimal, y nunca de un mes ya pasado', () => {
    const f = formularioDesde(
      cobro({
        metodo: 'tipo',
        cuota_general: null,
        valores_tipo: [{ tipo: 'casa', valor: '120.50' }],
        aplica_desde: '2026-08',
      }),
      AHORA,
    );

    expect(f.valoresTipo.casa).toBe('120,50');
    expect(f.valoresTipo.departamento).toBe('');
    expect(f.aplicaDesde).toBe('2026-11');
    expect(formularioDesde(cobro({ aplica_desde: '2027-02' }), AHORA).aplicaDesde).toBe('2027-02');
  });

  it('valida lo que pide cada método', () => {
    expect(validarCobro(formulario())).toEqual({});
    expect(validarCobro(formulario({ cuotaGeneral: '0' })).cuotaGeneral).toContain(
      'Escribe la cuota',
    );
    expect(validarCobro(formulario({ cuotaGeneral: '80,999' })).cuotaGeneral).toBeDefined();
    expect(
      validarCobro(formulario({ metodo: 'alicuota', presupuesto: '' })).presupuesto,
    ).toBeDefined();
    expect(validarCobro(formulario({ metodo: 'alicuota', presupuesto: '12.000,00' }))).toEqual({});
    expect(validarCobro(formulario({ metodo: 'tipo' })).valoresTipo).toBeDefined();
    expect(validarCobro(formulario({ metodo: 'unidad' }))).toEqual({});

    const conTipo = formulario({ metodo: 'tipo' });
    conTipo.valoresTipo.casa = '120';
    expect(validarCobro(conTipo)).toEqual({});
    conTipo.valoresTipo.local = 'abc';
    expect(validarCobro(conTipo).valoresTipo).toBeDefined();
  });

  it('manda solo lo que el método usa, con montos normalizados', () => {
    expect(aPeticionCobro(formulario({ cuotaGeneral: '80,5' }))).toEqual({
      metodo: 'general',
      cuota_general: '80.50',
      presupuesto_mensual: null,
      valores_tipo: null,
      dia_vencimiento: 10,
      aplica_desde: '2026-11',
    });

    const tipo = formulario({ metodo: 'tipo', cuotaGeneral: '99' });
    tipo.valoresTipo.casa = '120';
    tipo.valoresTipo.bodega = '1.000,00';
    const peticion = aPeticionCobro(tipo);
    expect(peticion.cuota_general).toBeNull();
    expect(peticion.valores_tipo).toEqual([
      { tipo: 'casa', valor: '120.00' },
      { tipo: 'bodega', valor: '1000.00' },
    ]);
  });

  it('detecta si hay cambios sin importar cómo se escribió el monto', () => {
    const base = formulario();
    expect(esIgualACobro(formulario({ cuotaGeneral: '80' }), base)).toBe(true);
    expect(esIgualACobro(formulario({ cuotaGeneral: '80,01' }), base)).toBe(false);
    expect(esIgualACobro(formulario({ diaVencimiento: 15 }), base)).toBe(false);
    expect(esIgualACobro(formulario({ aplicaDesde: '2026-12' }), base)).toBe(false);
    // Lo que el método no usa no cuenta como cambio
    expect(esIgualACobro(formulario({ presupuesto: '500' }), base)).toBe(true);
  });

  it('avisa si faltan datos en las unidades para el método elegido', () => {
    const faltan = cobro({ unidades: { ...UNIDADES, sin_alicuota: 3, sin_cuota_mensual: 5 } });

    expect(avisoDatosFaltantes(formulario(), faltan)).toBeNull();
    expect(avisoDatosFaltantes(formulario({ metodo: 'alicuota' }), faltan)).toContain(
      '3 unidades no tienen alícuota',
    );
    expect(avisoDatosFaltantes(formulario({ metodo: 'unidad' }), faltan)).toContain(
      '5 unidades no tienen cuota',
    );
    expect(avisoDatosFaltantes(formulario({ metodo: 'alicuota' }), cobro())).toBeNull();
  });
});

describe('proyección de la próxima emisión', () => {
  it('valor general: unidades con cupo × cuota', () => {
    expect(proyeccionCobro(formulario(), UNIDADES)).toEqual({
      metodo: 'Valor general',
      total: '$ 11.840,00',
      detalle: '148 unidades × $ 80,00',
      cuotaUnidad: '$ 80,00',
    });
    expect(proyeccionCobro(formulario({ cuotaGeneral: '' }), UNIDADES).total).toBe('—');
  });

  it('por tipo: suma por tipo y rango de valores', () => {
    const f = formulario({ metodo: 'tipo' });
    f.valoresTipo.departamento = '80';
    f.valoresTipo.casa = '120';
    f.valoresTipo.bodega = '10'; // sin bodegas: no entra al rango

    expect(proyeccionCobro(f, UNIDADES)).toEqual({
      metodo: 'Por tipo',
      total: '$ 12.320,00',
      detalle: '136 departamentos y 12 casas',
      cuotaUnidad: '$ 80,00 a $ 120,00',
    });
  });

  it('por alícuota: el presupuesto; por unidad: la suma de las cuotas', () => {
    expect(
      proyeccionCobro(formulario({ metodo: 'alicuota', presupuesto: '12.000,00' }), UNIDADES),
    ).toMatchObject({
      total: '$ 12.000,00',
      cuotaUnidad: 'Según su %',
    });
    expect(proyeccionCobro(formulario({ metodo: 'unidad' }), UNIDADES)).toMatchObject({
      total: '$ 12.615,00',
      detalle: 'Suma de las cuotas de 148 unidades',
    });
  });
});

describe('historial', () => {
  it('escribe cada cambio como el mockup', () => {
    expect(textoCambio({ campo: 'cuota_general', antes: '75.00', despues: '80.00' })).toBe(
      'Valor general: $ 75,00 → $ 80,00',
    );
    expect(textoCambio({ campo: 'dia_vencimiento', antes: '5', despues: '10' })).toBe(
      'Vencimiento: día 5 → día 10',
    );
    expect(textoCambio({ campo: 'dia_vencimiento', antes: '10', despues: '0' })).toBe(
      'Vencimiento: día 10 → último día',
    );
    expect(textoCambio({ campo: 'metodo', antes: 'general', despues: 'tipo' })).toBe(
      'Método: Valor general → Por tipo',
    );
    expect(textoCambio({ campo: 'valor_tipo:casa', antes: '100.00', despues: '120.00' })).toBe(
      'Valor Casa: $ 100,00 → $ 120,00',
    );
    expect(textoCambio({ campo: 'valor_tipo:casa', antes: '100.00', despues: null })).toBe(
      'Valor Casa: quitado',
    );
    expect(textoCambio({ campo: 'aplica_desde', antes: '2026-10', despues: '2026-11' })).toBe(
      'Aplica desde noviembre 2026',
    );
  });

  it('el registro inicial y el de cambios', () => {
    expect(
      textoRegistro({
        fecha: '2026-01-10T15:00:00Z',
        quien: 'Equipo SAFIC',
        inicial: true,
        cambios: [
          { campo: 'metodo', antes: null, despues: 'general' },
          { campo: 'cuota_general', antes: null, despues: '75.00' },
          { campo: 'dia_vencimiento', antes: null, despues: '10' },
        ],
      }),
    ).toBe('Configuración inicial: valor general $ 75,00');

    expect(
      textoRegistro({
        fecha: '2026-09-15T15:00:00Z',
        quien: 'María Rivas',
        inicial: false,
        cambios: [
          { campo: 'cuota_general', antes: '75.00', despues: '80.00' },
          { campo: 'aplica_desde', antes: '2026-09', despues: '2026-10' },
        ],
      }),
    ).toBe('Valor general: $ 75,00 → $ 80,00 · Aplica desde octubre 2026');
  });
});
