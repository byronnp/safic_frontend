import { z } from 'zod';

import { aCentavos, deCentavos } from '@/utils/dinero';
import { formatoFechaCorta } from '@/utils/formato';

import { normalizarMonto } from './cuotas.logica';
import type { EstadoGasto, FacturaManual, FiltroGastos, Gasto } from './services/gastos.service';
import type {
  EstadoProveedor,
  FiltroProveedores,
  NuevaCuentaProveedor,
  NuevoProveedor,
  TipoCuenta,
} from './services/proveedores.service';

type Tono = 'exito' | 'alerta' | 'error' | 'info' | 'neutro';

export const FILTROS_PROVEEDORES: { valor: FiltroProveedores; etiqueta: string }[] = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'con_saldo', etiqueta: 'Con saldo' },
  { valor: 'cuenta_en_cambio', etiqueta: 'Cuenta en cambio' },
];

export const FILTROS_GASTOS: { valor: FiltroGastos; etiqueta: string }[] = [
  { valor: 'todas', etiqueta: 'Todas' },
  { valor: 'por_aprobar', etiqueta: 'Por aprobar' },
  { valor: 'por_pagar', etiqueta: 'Por pagar' },
  { valor: 'pagadas', etiqueta: 'Pagadas' },
  { valor: 'rechazadas', etiqueta: 'Rechazadas' },
];

export const ESTADO_GASTO: Record<EstadoGasto, { texto: string; tono: Tono }> = {
  por_aprobar: { texto: 'Por aprobar', tono: 'alerta' },
  aprobada: { texto: 'Aprobada · por pagar', tono: 'info' },
  pagada: { texto: 'Pagada', tono: 'exito' },
  rechazada: { texto: 'Rechazada', tono: 'error' },
};

export const TIPOS_CUENTA: { valor: TipoCuenta; etiqueta: string }[] = [
  { valor: 'corriente', etiqueta: 'Corriente' },
  { valor: 'ahorros', etiqueta: 'Ahorros' },
];

export function etiquetaTipoCuenta(tipo: TipoCuenta): string {
  return TIPOS_CUENTA.find((t) => t.valor === tipo)?.etiqueta ?? tipo;
}

export function estadoProveedor(
  estado: EstadoProveedor,
  proximoVencimiento: string | null,
): { texto: string; tono: Tono } {
  switch (estado) {
    case 'sin_facturas':
      return { texto: 'Sin facturas', tono: 'neutro' };
    case 'por_aprobar':
      return { texto: 'Por aprobar', tono: 'alerta' };
    case 'vence_pronto':
      return {
        texto: proximoVencimiento
          ? `Vence ${formatoFechaCorta(proximoVencimiento)}`
          : 'Vence pronto',
        tono: 'alerta',
      };
    default:
      return { texto: 'Al día', tono: 'exito' };
  }
}

/** Fecha y hora en Ecuador: "9 oct, 17:05". */
const FECHA_HORA = new Intl.DateTimeFormat('es-EC', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'America/Guayaquil',
});

export function fechaHora(iso: string | null): string {
  return iso ? FECHA_HORA.format(new Date(iso)).replace('.', '').replace(',', ',') : '—';
}

/** "Se activa el 9 oct, 17:05 si nadie lo detiene; mientras tanto se paga a la cuenta anterior." */
export function textoCambioDeCuenta(c: {
  solicitado_por: string | null;
  solicitado_en: string | null;
  activa_en: string | null;
}): string {
  const quien = c.solicitado_por ? `por ${c.solicitado_por} ` : '';
  return (
    `Solicitado ${quien}el ${fechaHora(c.solicitado_en)}. Se activa el ${fechaHora(c.activa_en)} ` +
    'si nadie lo detiene; mientras tanto se paga a la cuenta anterior.'
  );
}

/** "Venció el 20 sept" / "Vence el 25 oct" para una factura. */
export function textoVence(g: Pick<Gasto, 'vence_el' | 'vencida' | 'estado'>): string {
  if (g.estado === 'pagada' || g.estado === 'rechazada') return formatoFechaCorta(g.vence_el);
  return `${g.vencida ? 'Venció el' : 'Vence el'} ${formatoFechaCorta(g.vence_el)}`;
}

// ---------- Formularios ----------

const RUC = /^\d{13}$/;

export interface FormularioProveedor {
  ruc: string;
  razon_social: string;
  categoria: string;
  email: string;
  telefono: string;
}

export const proveedorVacio = (): FormularioProveedor => ({
  ruc: '',
  razon_social: '',
  categoria: '',
  email: '',
  telefono: '',
});

export type ErroresProveedor = Partial<Record<keyof FormularioProveedor, string | undefined>>;

const esquemaProveedor = z.object({
  ruc: z.string().regex(RUC, 'El RUC tiene 13 dígitos.'),
  razon_social: z
    .string()
    .trim()
    .min(3, 'Escribe el nombre del proveedor.')
    .max(160, 'Máximo 160 letras.'),
  email: z.union([z.literal(''), z.email('El correo no es válido.')]),
});

export function validarProveedor(f: FormularioProveedor, conRuc: boolean): ErroresProveedor {
  const errores: ErroresProveedor = {};
  const r = esquemaProveedor.safeParse({ ...f, ruc: conRuc ? f.ruc.trim() : '0000000000000' });
  if (!r.success) {
    for (const p of r.error.issues) {
      const campo = p.path[0];
      if (campo === 'ruc' || campo === 'razon_social' || campo === 'email')
        errores[campo] ??= p.message;
    }
  }
  return errores;
}

/** Vacío = no se envía (la API no recibe cadenas vacías como valores). */
const opcional = (v: string): string | null => (v.trim() === '' ? null : v.trim());

export function peticionProveedor(f: FormularioProveedor): NuevoProveedor {
  return {
    ruc: f.ruc.trim(),
    razon_social: f.razon_social.trim(),
    categoria: opcional(f.categoria),
    email: opcional(f.email),
    telefono: opcional(f.telefono),
  };
}

export interface FormularioCuenta {
  banco: string;
  tipo: TipoCuenta;
  numero: string;
  titular: string;
  password: string;
}

export const cuentaVacia = (titular = ''): FormularioCuenta => ({
  banco: '',
  tipo: 'corriente',
  numero: '',
  titular,
  password: '',
});

export type ErroresCuenta = Partial<Record<keyof FormularioCuenta, string | undefined>>;

const esquemaCuenta = z.object({
  banco: z.string().trim().min(2, 'Escribe el banco.').max(60, 'Máximo 60 letras.'),
  numero: z
    .string()
    .trim()
    .regex(/^[0-9-]{6,30}$/, 'El número solo lleva dígitos y guiones (6 a 30).'),
  titular: z
    .string()
    .trim()
    .min(3, 'Escribe el titular de la cuenta.')
    .max(120, 'Máximo 120 letras.'),
  password: z.string().min(1, 'Escribe tu contraseña para confirmar el cambio.'),
});

export function validarCuenta(f: FormularioCuenta): ErroresCuenta {
  const errores: ErroresCuenta = {};
  const r = esquemaCuenta.safeParse(f);
  if (!r.success) {
    for (const p of r.error.issues) {
      const campo = p.path[0];
      if (campo === 'banco' || campo === 'numero' || campo === 'titular' || campo === 'password') {
        errores[campo] ??= p.message;
      }
    }
  }
  return errores;
}

export function peticionCuenta(f: FormularioCuenta): NuevaCuentaProveedor {
  return {
    banco: f.banco.trim(),
    tipo: f.tipo,
    numero: f.numero.trim(),
    titular: f.titular.trim(),
    password: f.password,
  };
}

export interface FormularioFactura {
  proveedorId: number | null;
  numero: string;
  fechaEmision: string;
  venceEl: string;
  subtotal: string;
  conIva: boolean;
  descripcion: string;
}

export const facturaVacia = (hoy: string): FormularioFactura => ({
  proveedorId: null,
  numero: '',
  fechaEmision: hoy,
  venceEl: '',
  subtotal: '',
  conIva: true,
  descripcion: '',
});

export type ErroresFactura = Partial<
  Record<'proveedorId' | 'numero' | 'fechaEmision' | 'venceEl' | 'subtotal', string | undefined>
>;

/** IVA del 15 % sobre el subtotal, redondeado al centavo (igual que la API). */
export function ivaDe(subtotal: string, conIva: boolean): string {
  const c = aCentavos(subtotal);
  return deCentavos(conIva ? Math.floor((c * 15 * 2 + 100) / 200) : 0);
}

export function totalDe(subtotal: string, conIva: boolean): string {
  return deCentavos(aCentavos(subtotal) + aCentavos(ivaDe(subtotal, conIva)));
}

export function validarFactura(f: FormularioFactura, hoy: string): ErroresFactura {
  const e: ErroresFactura = {};
  if (f.proveedorId === null) e.proveedorId = 'Elige el proveedor.';
  if (!/^\d{3}-\d{3}-\d{9}$/.test(f.numero.trim()))
    e.numero = 'El número tiene el formato 001-001-000000123.';
  if (f.fechaEmision === '') e.fechaEmision = 'Elige la fecha de emisión.';
  else if (f.fechaEmision > hoy) e.fechaEmision = 'La fecha de emisión no puede ser futura.';
  if (f.venceEl !== '' && f.fechaEmision !== '' && f.venceEl < f.fechaEmision) {
    e.venceEl = 'El vencimiento no puede ser anterior a la emisión.';
  }
  const subtotal = normalizarMonto(f.subtotal);
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(subtotal))
    e.subtotal = 'Escribe un monto válido (hasta dos decimales).';
  else if (aCentavos(subtotal) <= 0) e.subtotal = 'El subtotal debe ser mayor a cero.';
  return e;
}

export function peticionFactura(f: FormularioFactura): FacturaManual {
  return {
    proveedor_id: f.proveedorId ?? 0,
    numero: f.numero.trim(),
    fecha_emision: f.fechaEmision,
    vence_el: f.venceEl === '' ? null : f.venceEl,
    subtotal: normalizarMonto(f.subtotal),
    con_iva: f.conIva,
    categoria: null,
    descripcion: opcional(f.descripcion),
  };
}
