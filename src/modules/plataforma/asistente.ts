import { z } from 'zod';

import { cedulaValida, rucValido } from '@/utils/identificacion';

import type {
  CodigoPlan,
  MetodoCobro,
  NuevoCondominio,
  TipoCondominio,
  TipoUnidad,
} from './services/plataforma.service';

/**
 * Lógica del asistente "Nuevo condominio" (mockup F1Asistente): pasos, formulario,
 * validación con zod por paso y armado del cuerpo para POST /plataforma/condominios.
 */

export const PASOS = [
  { titulo: 'Datos generales', sub: 'Contrato y legales' },
  { titulo: 'Ubicación', sub: 'Pin en el mapa' },
  { titulo: 'Cobro de cuotas', sub: 'Método y valor' },
  { titulo: 'Amenidades', sub: 'Del catálogo' },
  { titulo: 'Administrador', sub: 'Invitación' },
] as const;

export const TOTAL_PASOS = PASOS.length;

export const TIPOS_CONDOMINIO: { valor: TipoCondominio; etiqueta: string }[] = [
  { valor: 'conjunto', etiqueta: 'Conjunto' },
  { valor: 'edificio', etiqueta: 'Edificio' },
  { valor: 'urbanizacion', etiqueta: 'Urbanización' },
  { valor: 'mixto', etiqueta: 'Mixto' },
];

export const METODOS_COBRO: { valor: MetodoCobro; nombre: string; detalle: string }[] = [
  { valor: 'general', nombre: 'Valor general', detalle: 'Todas pagan lo mismo' },
  { valor: 'tipo', nombre: 'Por tipo', detalle: 'Casa, departamento, local…' },
  { valor: 'alicuota', nombre: 'Por alícuota', detalle: '% del presupuesto mensual' },
  { valor: 'unidad', nombre: 'Por unidad', detalle: 'Cada unidad su valor' },
];

export const TIPOS_UNIDAD: { valor: TipoUnidad; etiqueta: string }[] = [
  { valor: 'departamento', etiqueta: 'Departamento' },
  { valor: 'casa', etiqueta: 'Casa' },
  { valor: 'local', etiqueta: 'Local' },
  { valor: 'parqueadero', etiqueta: 'Parqueadero' },
  { valor: 'bodega', etiqueta: 'Bodega' },
];

export const DIAS_VENCIMIENTO: { valor: number; etiqueta: string }[] = [
  { valor: 5, etiqueta: 'Día 5 de cada mes' },
  { valor: 10, etiqueta: 'Día 10 de cada mes' },
  { valor: 15, etiqueta: 'Día 15 de cada mes' },
  { valor: 0, etiqueta: 'Último día del mes' },
];

export interface FormularioCondominio {
  nombre: string;
  tipo: TipoCondominio;
  ruc: string;
  razonSocial: string;
  provincia: string;
  canton: string;
  parroquia: string;
  direccion: string;
  telefono: string;
  emailContacto: string;
  unidades: string;
  plan: CodigoPlan;
  valorUnidad: string;
  latitud: string;
  longitud: string;
  metodo: MetodoCobro;
  cuotaGeneral: string;
  presupuesto: string;
  valoresTipo: Record<TipoUnidad, string>;
  diaVencimiento: number;
  primeraCuota: string;
  cedula: string;
  nombreAdmin: string;
  correo: string;
  celular: string;
}

export type CampoFormulario = keyof FormularioCondominio;

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

/** Mes actual y los tres siguientes, como AAAA-MM (zona de Ecuador). */
export function mesesPrimeraCuota(hoy = new Date()): { valor: string; etiqueta: string }[] {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Guayaquil',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(hoy);
  let anio = Number(partes.find((p) => p.type === 'year')?.value);
  let mes = Number(partes.find((p) => p.type === 'month')?.value);

  const opciones: { valor: string; etiqueta: string }[] = [];
  for (let i = 0; i < 4; i++) {
    opciones.push({
      valor: `${anio}-${String(mes).padStart(2, '0')}`,
      etiqueta: `${MESES[mes - 1]} ${anio}`,
    });
    mes += 1;
    if (mes > 12) {
      mes = 1;
      anio += 1;
    }
  }
  return opciones;
}

export function formularioInicial(hoy = new Date()): FormularioCondominio {
  const siguienteMes = mesesPrimeraCuota(hoy)[1]!.valor;
  return {
    nombre: '',
    tipo: 'conjunto',
    ruc: '',
    razonSocial: '',
    provincia: '',
    canton: '',
    parroquia: '',
    direccion: '',
    telefono: '',
    emailContacto: '',
    unidades: '',
    plan: 'profesional',
    valorUnidad: '',
    latitud: '',
    longitud: '',
    metodo: 'general',
    cuotaGeneral: '',
    presupuesto: '',
    valoresTipo: { departamento: '', casa: '', local: '', parqueadero: '', bodega: '' },
    diaVencimiento: 10,
    primeraCuota: siguienteMes,
    cedula: '',
    nombreAdmin: '',
    correo: '',
    celular: '',
  };
}

/**
 * "80", "80,5" o "1.234,50" → "80.00", "80.50", "1234.50". Devuelve null si no
 * es un monto válido con hasta 2 decimales. Nunca pasa por float.
 */
export function normalizarMonto(texto: string): string | null {
  const limpio = texto.trim().replace(/\s|\$/g, '');
  if (limpio === '') {
    return null;
  }
  // Con coma decimal (es-EC) los puntos son de miles; sin coma, el punto es decimal.
  const conPunto = limpio.includes(',') ? limpio.replace(/\./g, '').replace(',', '.') : limpio;
  const m = /^(\d{1,7})(?:\.(\d{1,2}))?$/.exec(conPunto);
  if (!m) {
    return null;
  }
  const entero = m[1]!.replace(/^0+(?=\d)/, '');
  return `${entero}.${(m[2] ?? '').padEnd(2, '0')}`;
}

function montoPositivo(texto: string): boolean {
  const monto = normalizarMonto(texto);
  return monto !== null && /[1-9]/.test(monto);
}

const requerido = (mensaje: string) => z.string().trim().min(1, mensaje);
const monto = (mensaje: string) => z.string().refine(montoPositivo, mensaje);

const ESQUEMAS: Record<number, z.ZodType> = {
  1: z.object({
    nombre: requerido('Escribe el nombre del condominio.').max(120, 'Máximo 120 caracteres.'),
    ruc: z.string().refine((v) => rucValido(v.trim()), 'El RUC no es válido.'),
    razonSocial: requerido('Escribe la razón social.').max(160, 'Máximo 160 caracteres.'),
    provincia: requerido('Elige la provincia.'),
    canton: requerido('Elige el cantón.'),
    parroquia: requerido('Elige la parroquia.'),
    direccion: requerido('Escribe la dirección.').max(200, 'Máximo 200 caracteres.'),
    telefono: z
      .string()
      .refine(
        (v) => v.trim() === '' || /^0\d{8,9}$/.test(v.replace(/\s/g, '')),
        'Teléfono de 9 o 10 dígitos que empiece con 0.',
      ),
    emailContacto: z
      .string()
      .refine((v) => v.trim() === '' || z.email().safeParse(v.trim()).success, 'Correo no válido.'),
    unidades: z
      .string()
      .refine(
        (v) => /^\d+$/.test(v.trim()) && Number(v) >= 1 && Number(v) <= 10000,
        'Indica cuántas unidades tiene (1 a 10.000).',
      ),
    valorUnidad: monto('El valor por unidad debe ser mayor a 0, con hasta 2 decimales.'),
  }),
  2: z.object({
    latitud: z.string().refine((v) => {
      const n = Number(v);
      return v.trim() !== '' && n >= -5.1 && n <= 1.7;
    }, 'Ubica el pin en el mapa (latitud fuera del Ecuador).'),
    longitud: z.string().refine((v) => {
      const n = Number(v);
      return v.trim() !== '' && n >= -92.1 && n <= -75.1;
    }, 'Ubica el pin en el mapa (longitud fuera del Ecuador).'),
  }),
  4: z.object({}),
  5: z.object({
    cedula: z.string().refine((v) => cedulaValida(v.trim()), 'La cédula no es válida.'),
    nombreAdmin: requerido('Escribe los nombres y apellidos.'),
    correo: z.email('Escribe un correo válido.'),
    celular: z
      .string()
      .refine(
        (v) => v.trim() === '' || /^09\d{8}$/.test(v.replace(/\s/g, '')),
        'El celular tiene 10 dígitos y empieza con 09.',
      ),
  }),
};

function validarCobro(f: FormularioCondominio): Partial<Record<CampoFormulario, string>> {
  const errores: Partial<Record<CampoFormulario, string>> = {};
  if (f.metodo === 'general' && !montoPositivo(f.cuotaGeneral)) {
    errores.cuotaGeneral = 'Escribe la cuota mensual (mayor a 0, hasta 2 decimales).';
  }
  if (f.metodo === 'alicuota' && !montoPositivo(f.presupuesto)) {
    errores.presupuesto = 'Escribe el presupuesto mensual (mayor a 0).';
  }
  if (f.metodo === 'tipo') {
    const llenos = Object.values(f.valoresTipo).filter((v) => v.trim() !== '');
    if (llenos.length === 0 || llenos.some((v) => !montoPositivo(v))) {
      errores.valoresTipo = 'Escribe el valor de al menos un tipo (mayor a 0, hasta 2 decimales).';
    }
  }
  return errores;
}

/** Errores del paso `n` por campo (vacío si el paso es válido). */
export function validarPaso(
  n: number,
  f: FormularioCondominio,
): Partial<Record<CampoFormulario, string>> {
  if (n === 3) {
    return validarCobro(f);
  }
  const esquema = ESQUEMAS[n];
  if (!esquema) {
    return {};
  }
  const resultado = esquema.safeParse(f);
  const errores: Partial<Record<CampoFormulario, string>> = {};
  if (!resultado.success) {
    for (const problema of resultado.error.issues) {
      const campo = problema.path[0] as CampoFormulario;
      errores[campo] ??= problema.message;
    }
  }
  return errores;
}

/** Campo de la API (errores 422) → campo del formulario y paso donde se corrige. */
export const CAMPOS_API: Record<string, { campo: CampoFormulario; paso: number }> = {
  nombre: { campo: 'nombre', paso: 1 },
  ruc: { campo: 'ruc', paso: 1 },
  razon_social: { campo: 'razonSocial', paso: 1 },
  provincia_codigo: { campo: 'provincia', paso: 1 },
  canton_codigo: { campo: 'canton', paso: 1 },
  parroquia_codigo: { campo: 'parroquia', paso: 1 },
  direccion: { campo: 'direccion', paso: 1 },
  telefono: { campo: 'telefono', paso: 1 },
  email_contacto: { campo: 'emailContacto', paso: 1 },
  total_unidades: { campo: 'unidades', paso: 1 },
  plan_codigo: { campo: 'plan', paso: 1 },
  valor_unidad: { campo: 'valorUnidad', paso: 1 },
  latitud: { campo: 'latitud', paso: 2 },
  longitud: { campo: 'longitud', paso: 2 },
  'cobro.metodo': { campo: 'metodo', paso: 3 },
  'cobro.cuota_general': { campo: 'cuotaGeneral', paso: 3 },
  'cobro.presupuesto_mensual': { campo: 'presupuesto', paso: 3 },
  'cobro.valores_tipo': { campo: 'valoresTipo', paso: 3 },
  'cobro.dia_vencimiento': { campo: 'diaVencimiento', paso: 3 },
  'cobro.primera_cuota': { campo: 'primeraCuota', paso: 3 },
  'administrador.cedula': { campo: 'cedula', paso: 5 },
  'administrador.nombre': { campo: 'nombreAdmin', paso: 5 },
  'administrador.email': { campo: 'correo', paso: 5 },
  'administrador.celular': { campo: 'celular', paso: 5 },
};

/** Ubica un campo de la API, incluidos los de listas ("cobro.valores_tipo.0.valor"). */
export function campoDeApi(campoApi: string): { campo: CampoFormulario; paso: number } | null {
  if (CAMPOS_API[campoApi]) {
    return CAMPOS_API[campoApi];
  }
  if (campoApi.startsWith('cobro.valores_tipo.')) {
    return CAMPOS_API['cobro.valores_tipo']!;
  }
  if (campoApi.startsWith('amenidades')) {
    return { campo: 'nombre', paso: 4 };
  }
  return null;
}

const vacioANull = (v: string): string | null => (v.trim() === '' ? null : v.trim());

/** Cuerpo de POST /plataforma/condominios. Llamar solo con todos los pasos válidos. */
export function aPayload(
  f: FormularioCondominio,
  amenidades: Map<number, number>,
): NuevoCondominio {
  const valoresTipo = (Object.entries(f.valoresTipo) as [TipoUnidad, string][])
    .filter(([, v]) => v.trim() !== '')
    .map(([tipo, v]) => ({ tipo, valor: normalizarMonto(v)! }));

  return {
    nombre: f.nombre.trim(),
    tipo: f.tipo,
    ruc: f.ruc.trim(),
    razon_social: f.razonSocial.trim(),
    provincia_codigo: f.provincia,
    canton_codigo: f.canton,
    parroquia_codigo: f.parroquia,
    direccion: f.direccion.trim(),
    telefono: vacioANull(f.telefono.replace(/\s/g, '')),
    email_contacto: vacioANull(f.emailContacto),
    total_unidades: Number(f.unidades),
    plan_codigo: f.plan,
    valor_unidad: normalizarMonto(f.valorUnidad)!,
    latitud: Number(Number(f.latitud).toFixed(6)),
    longitud: Number(Number(f.longitud).toFixed(6)),
    cobro: {
      metodo: f.metodo,
      cuota_general: f.metodo === 'general' ? normalizarMonto(f.cuotaGeneral) : null,
      presupuesto_mensual: f.metodo === 'alicuota' ? normalizarMonto(f.presupuesto) : null,
      valores_tipo: f.metodo === 'tipo' ? valoresTipo : null,
      dia_vencimiento: f.diaVencimiento,
      primera_cuota: f.primeraCuota,
    },
    amenidades: [...amenidades.entries()].map(([amenidad_id, cantidad]) => ({
      amenidad_id,
      cantidad,
    })),
    administrador: {
      cedula: f.cedula.trim(),
      nombre: f.nombreAdmin.trim(),
      email: f.correo.trim().toLowerCase(),
      celular: vacioANull(f.celular.replace(/\s/g, '')),
    },
  };
}

/**
 * Total del mes para el resumen, en centavos enteros para no sumar con float:
 * unidades × valor (texto decimal) → texto decimal.
 */
export function multiplicarMonto(unidades: number, valor: string | null): string | null {
  if (valor === null || !Number.isInteger(unidades) || unidades < 0) {
    return null;
  }
  const [entero, dec = '00'] = valor.split('.');
  const centavos = BigInt(entero!) * 100n + BigInt(dec.padEnd(2, '0').slice(0, 2));
  const total = centavos * BigInt(unidades);
  return `${total / 100n}.${String(total % 100n).padStart(2, '0')}`;
}
