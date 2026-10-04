import { z } from 'zod';

import type {
  GuardarUnidad,
  MetodoCobro,
  ResponsablePago,
  TipoUnidad,
} from './services/unidades.service';

/** Formulario Nueva unidad (mockup F1NuevaUnidad). Los números se escriben como texto. */
export interface FormularioUnidad {
  codigo: string;
  bloqueId: number | null;
  tipo: TipoUnidad;
  piso: string;
  area: string;
  responsable: ResponsablePago;
  alicuota: string;
  cuotaMensual: string;
  valorPersonalizado: string;
}

export type CampoUnidad = keyof FormularioUnidad;

/** Nombre del campo en la API → campo del formulario (errores 422). */
export const CAMPOS_API: Record<string, CampoUnidad> = {
  codigo: 'codigo',
  bloque_id: 'bloqueId',
  tipo: 'tipo',
  piso: 'piso',
  area_m2: 'area',
  responsable_pago: 'responsable',
  alicuota: 'alicuota',
  cuota_mensual: 'cuotaMensual',
  valor_personalizado: 'valorPersonalizado',
};

export const TIPOS_UNIDAD: { valor: TipoUnidad; texto: string }[] = [
  { valor: 'departamento', texto: 'Departamento' },
  { valor: 'casa', texto: 'Casa' },
  { valor: 'local', texto: 'Local' },
  { valor: 'parqueadero', texto: 'Parqueadero' },
  { valor: 'bodega', texto: 'Bodega' },
];

/** Departamentos, casas y locales cuentan para el total contratado. */
export function cuentaParaCupo(tipo: TipoUnidad): boolean {
  return tipo === 'departamento' || tipo === 'casa' || tipo === 'local';
}

export function formularioVacio(): FormularioUnidad {
  return {
    codigo: '',
    bloqueId: null,
    tipo: 'departamento',
    piso: '',
    area: '',
    responsable: 'propietario',
    alicuota: '',
    cuotaMensual: '',
    valorPersonalizado: '',
  };
}

/** Qué montos pide el formulario según el método de cobro del condominio. */
export function camposDeCobro(metodo: MetodoCobro): {
  alicuota: 'obligatoria' | 'opcional';
  cuotaMensual: boolean;
  valorPersonalizado: boolean;
} {
  return {
    // La alícuota se acepta siempre (asambleas); solo es obligatoria al cobrar por alícuota.
    alicuota: metodo === 'alicuota' ? 'obligatoria' : 'opcional',
    cuotaMensual: metodo === 'unidad',
    valorPersonalizado: metodo === 'tipo' || metodo === 'alicuota',
  };
}

/**
 * "84", "84,5" o "1.234,50" → "84.00" / "84.50" / "1234.50" con hasta `decimales`.
 * Devuelve null si no es un número positivo válido. Nunca pasa por float.
 */
export function normalizarDecimal(texto: string, decimales: number): string | null {
  const limpio = texto.trim().replace(/\s|\$|%/g, '');
  if (limpio === '') {
    return null;
  }
  // Con coma decimal (es-EC) los puntos son de miles; sin coma, el punto es decimal.
  const conPunto = limpio.includes(',') ? limpio.replace(/\./g, '').replace(',', '.') : limpio;
  const m = new RegExp(`^(\\d{1,10})(?:\\.(\\d{1,${decimales}}))?$`).exec(conPunto);
  if (!m) {
    return null;
  }
  const entero = m[1]!.replace(/^0+(?=\d)/, '');
  const resultado = `${entero}.${(m[2] ?? '').padEnd(decimales, '0')}`;
  return /[1-9]/.test(resultado) ? resultado : null;
}

/** Texto decimal ("99.6200") que no pasa de 100, sin float. */
function noPasaDe100(valor: string): boolean {
  const [entero = '0', decimales = ''] = valor.split('.');
  const n = Number(entero);
  return n < 100 || (n === 100 && /^0*$/.test(decimales));
}

const decimal = (decimales: number, mensaje: string) =>
  z.string().refine((v) => normalizarDecimal(v, decimales) !== null, mensaje);

/** Campo opcional: vacío vale; si tiene algo, debe cumplir el esquema. */
const opcional = (esquema: z.ZodType<string>) =>
  z.string().superRefine((v, ctx) => {
    if (v.trim() === '') return;
    const resultado = esquema.safeParse(v);
    if (!resultado.success) {
      ctx.addIssue({
        code: 'custom',
        message: resultado.error.issues[0]?.message ?? 'Valor no válido.',
      });
    }
  });

function esquema(metodo: MetodoCobro) {
  const cobro = camposDeCobro(metodo);
  const alicuota = decimal(4, 'Escribe un porcentaje mayor que 0, con hasta 4 decimales.').refine(
    (v) => noPasaDe100(normalizarDecimal(v, 4) ?? '0'),
    'La alícuota no puede pasar de 100 %.',
  );
  const monto = decimal(2, 'Escribe un monto mayor que 0, con hasta 2 decimales.');

  return z.object({
    codigo: z
      .string()
      .trim()
      .min(1, 'Escribe el código de la unidad.')
      .max(20, 'Máximo 20 caracteres.')
      .regex(
        /^[A-Za-z0-9][A-Za-z0-9 .\-/]*$/,
        'Usa letras, números, guion, punto o barra (ej. A-102).',
      ),
    piso: z
      .string()
      .refine(
        (v) => v.trim() === '' || (/^-?\d+$/.test(v.trim()) && Number(v) >= -5 && Number(v) <= 200),
        'El piso es un número entero entre -5 y 200.',
      ),
    area: decimal(2, 'Escribe el área en m² (mayor que 0, hasta 2 decimales).'),
    alicuota: cobro.alicuota === 'obligatoria' ? alicuota : opcional(alicuota),
    cuotaMensual: cobro.cuotaMensual ? monto : z.string(),
    valorPersonalizado: cobro.valorPersonalizado ? opcional(monto) : z.string(),
  });
}

export type ResultadoValidacion =
  { ok: true; datos: GuardarUnidad } | { ok: false; errores: Partial<Record<CampoUnidad, string>> };

/** Valida con zod y arma el cuerpo de POST /unidades según el método de cobro. */
export function validarUnidad(f: FormularioUnidad, metodo: MetodoCobro): ResultadoValidacion {
  const resultado = esquema(metodo).safeParse(f);

  if (!resultado.success) {
    const errores: Partial<Record<CampoUnidad, string>> = {};
    for (const problema of resultado.error.issues) {
      const campo = problema.path[0] as CampoUnidad;
      errores[campo] ??= problema.message;
    }
    return { ok: false, errores };
  }

  const cobro = camposDeCobro(metodo);
  const datos: GuardarUnidad = {
    codigo: f.codigo.trim().toUpperCase(),
    bloque_id: f.bloqueId,
    tipo: f.tipo,
    piso: f.piso.trim() === '' ? null : Number(f.piso),
    area_m2: normalizarDecimal(f.area, 2)!,
    responsable_pago: f.responsable,
    alicuota: normalizarDecimal(f.alicuota, 4),
  };
  if (cobro.cuotaMensual) {
    datos.cuota_mensual = normalizarDecimal(f.cuotaMensual, 2)!;
  }
  if (cobro.valorPersonalizado) {
    datos.valor_personalizado = normalizarDecimal(f.valorPersonalizado, 2);
  }
  return { ok: true, datos };
}
