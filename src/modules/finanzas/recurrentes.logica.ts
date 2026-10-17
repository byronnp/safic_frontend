import { z } from 'zod';

import { aCentavos } from '@/utils/dinero';
import { formatoFechaCorta } from '@/utils/formato';

import { normalizarMonto } from './cuotas.logica';
import type {
  CambiosRecurrente,
  EstadoMes,
  GastoRecurrente,
  NuevoRecurrente,
} from './services/recurrentes.service';

type Tono = 'exito' | 'alerta' | 'error' | 'info' | 'neutro';

export const ESTADO_MES: Record<EstadoMes, { texto: string; tono: Tono }> = {
  programado: { texto: 'Programado', tono: 'info' },
  falta_factura: { texto: 'Falta la factura', tono: 'alerta' },
  factura_recibida: { texto: 'Factura recibida', tono: 'exito' },
  pausado: { texto: 'Pausado', tono: 'neutro' },
};

/** «Día 1», «Día 15». */
export function textoDia(dia: number): string {
  return `Día ${dia}`;
}

/** «Variable» si no tiene monto. */
export function textoMonto(
  r: Pick<GastoRecurrente, 'monto'>,
  formato: (m: string) => string,
): string {
  return r.monto === null ? 'Variable' : formato(r.monto);
}

/** «Agua · 8 oct». */
export function textoProximo(p: { nombre: string; fecha: string } | null): string {
  return p === null ? '—' : `${p.nombre} · ${formatoFechaCorta(p.fecha)}`;
}

export interface FormularioRecurrente {
  nombre: string;
  proveedorId: number | null;
  categoria: string;
  variable: boolean;
  monto: string;
  dia: string;
  aprobacionAutomatica: boolean;
}

export type ErroresRecurrente = Partial<
  Record<'nombre' | 'proveedorId' | 'monto' | 'dia', string | undefined>
>;

export const recurrenteVacio = (): FormularioRecurrente => ({
  nombre: '',
  proveedorId: null,
  categoria: '',
  variable: false,
  monto: '',
  dia: '1',
  aprobacionAutomatica: false,
});

export function formularioDeRecurrente(r: GastoRecurrente): FormularioRecurrente {
  return {
    nombre: r.nombre,
    proveedorId: r.proveedor.id,
    categoria: r.categoria ?? '',
    variable: r.monto === null,
    monto: r.monto ?? '',
    dia: String(r.dia_mes),
    aprobacionAutomatica: r.aprobacion_automatica,
  };
}

const esquema = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, 'Escribe el nombre del gasto (mínimo 3 letras).')
    .max(80, 'Máximo 80 caracteres.'),
});

export function validarRecurrente(f: FormularioRecurrente): ErroresRecurrente {
  const e: ErroresRecurrente = {};
  const n = esquema.safeParse({ nombre: f.nombre });
  if (!n.success) e.nombre = n.error.issues[0]?.message;
  if (f.proveedorId === null) e.proveedorId = 'Elige el proveedor.';
  if (!f.variable) {
    const monto = normalizarMonto(f.monto);
    if (!/^\d{1,8}(\.\d{1,2})?$/.test(monto))
      e.monto = 'Escribe un monto válido (hasta dos decimales).';
    else if (aCentavos(monto) <= 0) e.monto = 'El monto debe ser mayor a cero.';
  }
  if (!/^\d{1,2}$/.test(f.dia.trim()) || Number(f.dia) < 1 || Number(f.dia) > 28)
    e.dia = 'El día va del 1 al 28.';
  return e;
}

/** Variable = sin monto; y sin monto no hay aprobación automática. */
export function peticionRecurrente(f: FormularioRecurrente): NuevoRecurrente {
  return {
    nombre: f.nombre.trim(),
    proveedor_id: f.proveedorId ?? 0,
    categoria: f.categoria.trim() === '' ? null : f.categoria.trim(),
    monto: f.variable ? null : normalizarMonto(f.monto),
    dia_mes: Number(f.dia),
    aprobacion_automatica: f.variable ? false : f.aprobacionAutomatica,
  };
}

/** Solo lo que cambió respecto al gasto original. */
export function cambiosDeRecurrente(
  original: GastoRecurrente,
  f: FormularioRecurrente,
): CambiosRecurrente {
  const nuevo = peticionRecurrente(f);
  const c: CambiosRecurrente = {};
  if (nuevo.nombre !== original.nombre) c.nombre = nuevo.nombre;
  if (nuevo.proveedor_id !== original.proveedor.id) c.proveedor_id = nuevo.proveedor_id;
  if (nuevo.categoria !== original.categoria) c.categoria = nuevo.categoria;
  if (nuevo.monto !== original.monto) c.monto = nuevo.monto;
  if (nuevo.dia_mes !== original.dia_mes) c.dia_mes = nuevo.dia_mes;
  if (nuevo.aprobacion_automatica !== original.aprobacion_automatica)
    c.aprobacion_automatica = nuevo.aprobacion_automatica;
  return c;
}
