import { describe, expect, it } from 'vitest';

import {
  aPayload,
  campoDeApi,
  formularioInicial,
  mesesPrimeraCuota,
  multiplicarMonto,
  normalizarMonto,
  validarPaso,
  type FormularioCondominio,
} from '../asistente';

function lleno(cambios: Partial<FormularioCondominio> = {}): FormularioCondominio {
  return {
    ...formularioInicial(new Date('2026-10-03T15:00:00-05:00')),
    nombre: 'Conjunto Los Arupos',
    ruc: '1792456781001',
    razonSocial: 'Conjunto Habitacional Los Arupos',
    provincia: '17',
    canton: '1701',
    parroquia: '170156',
    direccion: 'Av. Ilaló',
    unidades: '130',
    valorUnidad: '2',
    latitud: '-0.285412',
    longitud: '-78.471236',
    cuotaGeneral: '80,00',
    cedula: '1712345675',
    nombreAdmin: 'María Rivas',
    correo: 'Maria@LosArupos.ec',
    celular: '099 412 7788',
    ...cambios,
  };
}

describe('montos', () => {
  it.each([
    ['80', '80.00'],
    ['80,5', '80.50'],
    ['1.234,50', '1234.50'],
    ['2.00', '2.00'],
    ['$ 15', '15.00'],
    ['2,005', null],
    ['abc', null],
    ['', null],
  ])('%s → %s', (texto, esperado) => {
    expect(normalizarMonto(texto)).toBe(esperado);
  });

  it('multiplica sin float', () => {
    expect(multiplicarMonto(130, '2.00')).toBe('260.00');
    expect(multiplicarMonto(3, '0.10')).toBe('0.30');
    expect(multiplicarMonto(148, '1.35')).toBe('199.80');
  });
});

describe('primera cuota', () => {
  it('ofrece el mes actual y los tres siguientes en la zona de Ecuador', () => {
    const meses = mesesPrimeraCuota(new Date('2026-12-01T03:00:00Z')); // 30 nov en Ecuador
    expect(meses.map((m) => m.valor)).toEqual(['2026-11', '2026-12', '2027-01', '2027-02']);
    expect(meses[2]!.etiqueta).toBe('Enero 2027');
  });
});

describe('validación por paso', () => {
  it('un formulario completo pasa todos los pasos', () => {
    const f = lleno();
    for (const paso of [1, 2, 3, 4, 5]) {
      expect(validarPaso(paso, f)).toEqual({});
    }
  });

  it('marca RUC, cédula y celular inválidos', () => {
    expect(validarPaso(1, lleno({ ruc: '1792456781000' })).ruc).toBe('El RUC no es válido.');
    expect(validarPaso(5, lleno({ cedula: '1712345678' })).cedula).toBe('La cédula no es válida.');
    expect(validarPaso(5, lleno({ celular: '022345678' })).celular).toBeDefined();
  });

  it('pide la cuota según el método de cobro', () => {
    expect(validarPaso(3, lleno({ cuotaGeneral: '' })).cuotaGeneral).toBeDefined();
    expect(
      validarPaso(3, lleno({ metodo: 'alicuota', presupuesto: '' })).presupuesto,
    ).toBeDefined();
    expect(validarPaso(3, lleno({ metodo: 'tipo' })).valoresTipo).toBeDefined();
    expect(validarPaso(3, lleno({ metodo: 'unidad', cuotaGeneral: '' }))).toEqual({});
  });

  it('exige el pin dentro del Ecuador', () => {
    expect(validarPaso(2, lleno({ latitud: '40.4' })).latitud).toBeDefined();
  });
});

describe('cuerpo de la petición', () => {
  it('normaliza montos, correo y celular, y envía solo los datos del método', () => {
    const payload = aPayload(lleno(), new Map([[3, 2]]));

    expect(payload.valor_unidad).toBe('2.00');
    expect(payload.cobro).toEqual({
      metodo: 'general',
      cuota_general: '80.00',
      presupuesto_mensual: null,
      valores_tipo: null,
      dia_vencimiento: 10,
      primera_cuota: '2026-11',
    });
    expect(payload.administrador).toEqual({
      cedula: '1712345675',
      nombre: 'María Rivas',
      email: 'maria@losarupos.ec',
      celular: '0994127788',
    });
    expect(payload.amenidades).toEqual([{ amenidad_id: 3, cantidad: 2 }]);
    expect(payload.telefono).toBeNull();
  });

  it('con método por tipo envía solo los tipos llenos', () => {
    const f = lleno({ metodo: 'tipo' });
    f.valoresTipo.departamento = '80';
    f.valoresTipo.casa = '120,5';
    expect(aPayload(f, new Map()).cobro.valores_tipo).toEqual([
      { tipo: 'departamento', valor: '80.00' },
      { tipo: 'casa', valor: '120.50' },
    ]);
  });
});

describe('errores de la API', () => {
  it('ubica cada campo en su paso', () => {
    expect(campoDeApi('administrador.cedula')).toEqual({ campo: 'cedula', paso: 5 });
    expect(campoDeApi('cobro.valores_tipo.1.valor')).toEqual({ campo: 'valoresTipo', paso: 3 });
    expect(campoDeApi('otro')).toBeNull();
  });
});
